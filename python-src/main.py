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


def main():
    all_markets = []
    
    try:
        all_markets.extend(fetch_polymarket_markets())
    except Exception as e:
        print("Error fetching Polymarket:", e)

    df = pd.DataFrame(all_markets)

    print("\nTotal Open Markets:", len(df))
    print(df.head())

    df.to_csv("open_polymarket_markets.csv", index=False)
    print("\nSaved to open_polymarket_markets.csv")


if __name__ == "__main__":
    main() 