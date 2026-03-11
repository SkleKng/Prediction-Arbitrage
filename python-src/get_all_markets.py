import requests
import pandas as pd


# ==========================
# POLYMARKET
# ==========================

def fetch_polymarket_markets():
    print("Fetching Polymarket markets (paginated)...")

    url = "https://gamma-api.polymarket.com/markets"
    all_markets = []

    offset = 0
    limit = 500

    while True:
        params = {
            "closed": "false",
            "limit": limit,
            "offset": offset
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if not data:
            break

        for market in data:
            all_markets.append({
                "platform": "Polymarket",
                "title": market.get("question"),
                "market_slug": market.get("slug"),
                "end_date": market.get("endDate"),
                "liquidity": market.get("liquidity"),
                "volume": market.get("volume"),
                "url": f"https://polymarket.com/market/{market.get('slug')}"
            })

        print(f"Fetched {len(data)} markets (offset {offset})")

        offset += limit

    return all_markets

def fetch_kalshi_markets():
    print("Fetching Kalshi markets (cursor paginated)...")

    base_url = "https://api.elections.kalshi.com/trade-api/v2/markets"
    all_markets = []

    cursor = None

    while True:
        params = {
            "limit": 1000,
            "status": "open",   # Only open markets
            "mve_filter": "exclude",
            "min_close_ts": 1773213785
        }

        if cursor:
            params["cursor"] = cursor

        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        markets = data.get("markets", [])
        cursor = data.get("cursor")

        print(f"Fetched {len(markets)} markets, cursor: {cursor}")

        for market in markets:
            all_markets.append({
                "platform": "Kalshi",
                "ticker": market["ticker"],
                "event_ticker": market["event_ticker"],
                "title": market.get("title"),
                "yes_bid": market.get("yes_bid_dollars"),
                "yes_ask": market.get("yes_ask_dollars"),
                "volume_24h": market.get("volume_24h"),
                "open_interest": market.get("open_interest"),
                "status": market.get("status"),
                "close_time": market.get("close_time"),
                "url": f"https://kalshi.com/markets/{market['event_ticker']}/{market['ticker']}"
            })

        # Stop when no next page
        if not cursor:
            break

    print(f"Total Kalshi markets fetched: {len(all_markets)}")
    return all_markets


def main():
    # polymarkets = []
    
    # try:
    #     polymarkets.extend(fetch_polymarket_markets())
    # except Exception as e:
    #     print("Error fetching Polymarket:", e)

    # df = pd.DataFrame(polymarkets)

    # print("\nTotal Polymarket Markets:", len(df))
    # print(df.head())

    # df.to_csv("open_polymarket_markets.csv", index=False)
    # print("\nSaved to open_polymarket_markets.csv")

    kalshi_markets = []

    try:
        kalshi_markets.extend(fetch_kalshi_markets())
    except Exception as e:
        print("Error fetching Kalshi markets:", e)

    df_kalshi = pd.DataFrame(kalshi_markets)

    print("\nTotal Kalshi Markets:", len(df_kalshi))
    print(df_kalshi.head())

    df_kalshi.to_csv("open_kalshi_markets.csv", index=False)
    print("\nSaved to open_kalshi_markets.csv")

if __name__ == "__main__":
    main() 