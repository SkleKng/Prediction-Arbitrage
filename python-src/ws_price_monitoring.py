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

EMBED_OUTPUT_FILE = Path("matches/embed_matches.json")
PRICES_OUTPUT_FILE = Path("prices/live_prices.json")

def load_matches():
    with open(EMBED_OUTPUT_FILE) as f:
        data = json.load(f)
    
    matches = []
    for group in data:
        for match in group["matches"]:
            poly = match["polymarket"]
            kalshi = match["kalshi"]
            matches.append({
                "poly_title": poly["title"],
                "kalshi_title": kalshi["title"],
                "poly_token_ids": poly["clob_token_ids"],  # [YES, NO]
                "kalshi_ticker": kalshi["ticker"],
            })
    return matches

# ── Shared price state ────────────────────────────────────────────────────────
prices = {}

def update_price(market_key, data: dict):
    prices[market_key] = data
    with open(PRICES_OUTPUT_FILE, "w") as f:
        json.dump(prices, f, indent=2)

# ── Polymarket WebSocket ──────────────────────────────────────────────────────
async def polymarket_ws(matches):
    url = "wss://ws-subscriptions-clob.polymarket.com/ws/market"

    token_map = {}
    all_token_ids = []
    for m in matches:
        key = f"poly::{m['poly_title']}"
        yes_id, no_id = m["poly_token_ids"][0], m["poly_token_ids"][1]
        token_map[yes_id] = (key, "yes_ask")
        token_map[no_id] = (key, "no_ask")
        all_token_ids.extend([yes_id, no_id])

    book = {}

    while True:
        try:
            async with websockets.connect(url) as ws:
                await ws.send(json.dumps({
                    "type": "market",
                    "assets_ids": all_token_ids,
                    "custom_feature_enabled": True
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

                            market_key, side = token_map[asset_id]
                            if market_key not in book:
                                book[market_key] = {}

                            book[market_key][side] = float(msg.get("best_ask", 0))
                            book[market_key]["timestamp"] = msg.get("timestamp", "")

                            if "yes_ask" in book[market_key] and "no_ask" in book[market_key]:
                                update_price(market_key, book[market_key].copy())
                                print(f"[Polymarket] {market_key[:60]} | YES ask: {book[market_key]['yes_ask']:.3f} NO ask: {book[market_key]['no_ask']:.3f}")

                    except asyncio.TimeoutError:
                        await ws.send("PING")
        except Exception as e:
            print(f"[Polymarket] Connection error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

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
    ticker_map = {m["kalshi_ticker"]: m["kalshi_title"] for m in matches}

    while True:
        try:
            timestamp = str(int(datetime.datetime.now().timestamp() * 1000))
            signature = sign_pss_text(private_key, timestamp + "GET" + path)  # <-- use PSS now

            headers = {
                "KALSHI-ACCESS-KEY": api_key,
                "KALSHI-ACCESS-TIMESTAMP": timestamp,
                "KALSHI-ACCESS-SIGNATURE": signature,
            }

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
                        no_ask = data.get("no_ask_dollars")
                        yes_bid = data.get("yes_bid_dollars")
                        
                        if no_ask is None and yes_bid is not None:
                            no_ask = round(1.0 - float(yes_bid), 3)

                        if not yes_ask:
                            continue

                        market_key = f"kalshi::{ticker}"
                        update_price(market_key, {
                            "yes_ask": float(yes_ask),
                            "no_ask": float(no_ask) if no_ask is not None else None,
                            "timestamp": data.get("time", "")
                        })
                        print(f"[Kalshi] {market_key[:60]} | YES ask: {float(yes_ask):.3f}")


                    except asyncio.TimeoutError:
                        pass
        except Exception as e:
            print(f"[Kalshi] Connection error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

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