import asyncio
import json
import websockets
from pathlib import Path
import os
from dotenv import load_dotenv
import base64
import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

load_dotenv()

KALSHI_API_KEY = os.getenv("KALSHI_API_KEY")
KALSHI_PRIVATE_KEY = os.getenv("KALSHI_PRIVATE_KEY")

EMBED_OUTPUT_FILE = Path("matches/ai_matches.json")
PRICES_OUTPUT_FILE = Path("prices/live_prices.json")
ARB_OUTPUT_FILE = Path("prices/arb_opportunities.json")

Path("prices").mkdir(exist_ok=True)

def load_matches():
    with open(EMBED_OUTPUT_FILE) as f:
        data = json.load(f)

    matches = []
    for group in data:
        for item in group["matches"]:
            if item.get("same_market") != "yes":
                continue
            matches.append({
                "poly_title": item["polymarket_title"],
                "kalshi_title": item["kalshi_title"],
                "poly_token_ids": item["clob_token_ids"],  # [YES, NO]
                "kalshi_ticker": item["kalshi_ticker"],
            })
    return matches


# ── Shared price state ────────────────────────────────────────────────────────
prices = {}
arb_opportunities = []

def kalshi_taker_fee(p: float, contracts: float = 1.0) -> float:
    """Fee = round_up(0.07 * C * P * (1 - P))"""
    import math
    return math.ceil(0.07 * contracts * p * (1 - p) * 100) / 100

def poly_taker_fee_rate(p: float) -> float:
    """
    Polymarket US regulated exchange: flat 0.30% taker fee on contract premium.
    Global Polymarket uses a dynamic rate peaking at ~1.80% at p=0.50,
    but if you're a US trader on polymarketexchange.com use 0.003.
    Adjust POLY_TAKER_RATE below if you're on the global platform.
    """
    return 0.003  # 0.30% for US; swap to (0.018 * 4 * p * (1 - p)) for global

def effective_buy_cost(price: float, platform: str) -> float:
    """
    Returns the all-in cost to buy 1 contract at `price` including taker fees.
    """
    if platform == "kalshi":
        return price + kalshi_taker_fee(price)
    elif platform == "poly":
        return price * (1 + poly_taker_fee_rate(price))
    return price

def check_arb(match_title: str, poly_key: str, kalshi_key: str):
    """
    Arb exists if:
      cost(YES on A) + cost(NO on B) < $1.00
    for either combination of A=poly,B=kalshi or A=kalshi,B=poly.

    NO price on Kalshi is derived as: 1.0 - yes_bid
    NO price on Polymarket is the ask price of the NO token directly.
    """
    poly = prices.get(poly_key)
    kalshi = prices.get(kalshi_key)

    if not poly or not kalshi:
        return

    poly_yes_ask = poly.get("yes_ask")
    poly_no_ask = poly.get("no_ask")
    kalshi_yes_ask = kalshi.get("yes_ask")
    # Derive kalshi NO cost from yes_bid: buying NO = filling against YES bidders
    kalshi_yes_bid = kalshi.get("yes_bid")

    if None in (poly_yes_ask, poly_no_ask, kalshi_yes_ask, kalshi_yes_bid):
        return

    # Cost to buy NO on Kalshi = 1 - yes_bid (you're the counterparty to the best YES buyer)
    kalshi_no_cost_raw = 1.0 - kalshi_yes_bid

    # All-in costs including taker fees
    cost_yes_poly = effective_buy_cost(poly_yes_ask, "poly")
    cost_no_poly = effective_buy_cost(poly_no_ask, "poly")
    cost_yes_kalshi = effective_buy_cost(kalshi_yes_ask, "kalshi")
    cost_no_kalshi = effective_buy_cost(kalshi_no_cost_raw, "kalshi")

    results = {
        "YES_poly_NO_kalshi": cost_yes_poly + cost_no_kalshi,
        "YES_kalshi_NO_poly": cost_yes_kalshi + cost_no_poly,
    }

    for leg, total_cost in results.items():
        profit = 1.0 - total_cost
        if profit > 0:
            opp = {
                "match": match_title,
                "strategy": leg,
                "total_cost": round(total_cost, 5),
                "profit_per_contract": round(profit, 5),
                "profit_pct": round(profit * 100, 3),
                "poly_yes_ask": poly_yes_ask,
                "poly_no_ask": poly_no_ask,
                "kalshi_yes_ask": kalshi_yes_ask,
                "kalshi_yes_bid": kalshi_yes_bid,
                "kalshi_no_cost_raw": round(kalshi_no_cost_raw, 4),
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }
            arb_opportunities.append(opp)
            with open(ARB_OUTPUT_FILE, "w") as f:
                json.dump(arb_opportunities, f, indent=2)
            print(
                f"\n🚨 ARB DETECTED [{leg}] | {match_title[:50]}\n"
                f"   Total cost: ${total_cost:.4f} | Profit: ${profit:.4f} ({profit*100:.2f}%)\n"
                f"   Poly YES ask: {poly_yes_ask:.3f} | Kalshi YES ask: {kalshi_yes_ask:.3f} | "
                f"Kalshi NO (derived): {kalshi_no_cost_raw:.3f}\n"
            )

def update_price(market_key: str, data: dict, match_title: str, poly_key: str, kalshi_key: str):
    prices[market_key] = data
    with open(PRICES_OUTPUT_FILE, "w") as f:
        json.dump(prices, f, indent=2)
    check_arb(match_title, poly_key, kalshi_key)


# ── Polymarket WebSocket ──────────────────────────────────────────────────────
async def polymarket_ws(matches):
    url = "wss://ws-subscriptions-clob.polymarket.com/ws/market"

    # Map each token ID -> (market_key, "yes_ask" | "no_ask")
    token_map = {}
    all_token_ids = []
    # Also keep a map from poly_key -> (match_title, kalshi_key) for arb checks
    poly_to_match = {}

    for m in matches:
        poly_key = f"poly::{m['poly_title']}"
        kalshi_key = f"kalshi::{m['kalshi_ticker']}"
        yes_id, no_id = m["poly_token_ids"][0], m["poly_token_ids"][1]
        token_map[yes_id] = (poly_key, "yes_ask")
        token_map[no_id] = (poly_key, "no_ask")
        all_token_ids.extend([yes_id, no_id])
        poly_to_match[poly_key] = (m["poly_title"], kalshi_key)

    book = {}

    async with websockets.connect(url) as ws:
        await ws.send(json.dumps({
            "type": "market",
            "assets_ids": all_token_ids,
            "custom_feature_enabled": True  # enables best_bid_ask events
        }))
        print(f"[Polymarket] Subscribed to {len(matches)} markets ({len(all_token_ids)} tokens)")

        while True:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=10)
                if raw == "PONG":
                    continue

                msg = json.loads(raw)

                if msg.get("event_type") == "best_bid_ask":
                    asset_id = msg.get("asset_id")
                    if asset_id not in token_map:
                        continue

                    poly_key, side = token_map[asset_id]
                    if poly_key not in book:
                        book[poly_key] = {}

                    # best_ask is the price to BUY this token (YES or NO)
                    book[poly_key][side] = float(msg.get("best_ask", 0))
                    book[poly_key]["timestamp"] = msg.get("timestamp", "")

                    if "yes_ask" in book[poly_key] and "no_ask" in book[poly_key]:
                        match_title, kalshi_key = poly_to_match[poly_key]
                        update_price(poly_key, book[poly_key].copy(), match_title, poly_key, kalshi_key)
                        print(
                            f"[Polymarket] {poly_key[:55]} | "
                            f"YES ask: {book[poly_key]['yes_ask']:.3f}  "
                            f"NO ask: {book[poly_key]['no_ask']:.3f}"
                        )

            except asyncio.TimeoutError:
                await ws.send("PING")


# ── Kalshi WebSocket ──────────────────────────────────────────────────────────
def load_private_key(private_key_str: str):
    key_bytes = private_key_str.encode("utf-8")
    return serialization.load_pem_private_key(key_bytes, password=None, backend=default_backend())

def sign_pss_text(private_key, text: str) -> str:
    message = text.encode("utf-8")
    signature = private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.DIGEST_LENGTH
        ),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode("utf-8")

async def kalshi_ws(matches, api_key: str, private_key_str: str):
    url = "wss://api.elections.kalshi.com/trade-api/ws/v2"
    path = "/trade-api/ws/v2"

    private_key = load_private_key(private_key_str)
    timestamp = str(int(datetime.datetime.now().timestamp() * 1000))
    signature = sign_pss_text(private_key, timestamp + "GET" + path)

    headers = {
        "KALSHI-ACCESS-KEY": api_key,
        "KALSHI-ACCESS-TIMESTAMP": timestamp,
        "KALSHI-ACCESS-SIGNATURE": signature,
    }

    ticker_map = {m["kalshi_ticker"]: m for m in matches}

    async with websockets.connect(url, additional_headers=headers) as ws:
        for i, m in enumerate(matches):
            await ws.send(json.dumps({
                "id": i + 1,
                "cmd": "subscribe",
                "params": {
                    "channels": ["ticker"],
                    "market_tickers": [m["kalshi_ticker"]]
                }
            }))

        print(f"[Kalshi] Subscribed to {len(matches)} markets")

        while True:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=10)
                msg = json.loads(raw)

                if msg.get("type") != "ticker":
                    continue

                data = msg.get("msg", {})
                ticker = data.get("market_ticker")
                if not ticker or ticker not in ticker_map:
                    continue

                yes_ask = data.get("yes_ask_dollars")
                yes_bid = data.get("yes_bid_dollars")

                if not yes_ask or not yes_bid:
                    continue

                m = ticker_map[ticker]
                poly_key = f"poly::{m['poly_title']}"
                kalshi_key = f"kalshi::{ticker}"
                match_title = m["kalshi_title"]

                # NOTE: Kalshi does NOT have a no_ask field.
                # To buy NO on Kalshi, you are filling against YES bidders,
                # so the effective NO price = 1.0 - yes_bid_dollars.
                # We store yes_bid so check_arb can derive it cleanly.
                kalshi_data = {
                    "yes_ask": float(yes_ask),
                    "yes_bid": float(yes_bid),
                    "timestamp": data.get("time", "")
                }

                update_price(kalshi_key, kalshi_data, match_title, poly_key, kalshi_key)
                print(
                    f"[Kalshi]    {kalshi_key[:55]} | "
                    f"YES ask: {float(yes_ask):.3f}  "
                    f"YES bid: {float(yes_bid):.3f}  "
                    f"(NO cost derived: {1.0 - float(yes_bid):.3f})"
                )

            except asyncio.TimeoutError:
                pass  # Kalshi doesn't require a client-side ping


# ── Main ──────────────────────────────────────────────────────────────────────
async def main(api_key: str, private_key_str: str):
    matches = load_matches()
    print(f"Loaded {len(matches)} matches to monitor")

    await asyncio.gather(
        polymarket_ws(matches),
        kalshi_ws(matches, api_key, private_key_str)
    )

if __name__ == "__main__":
    asyncio.run(main(KALSHI_API_KEY, KALSHI_PRIVATE_KEY))