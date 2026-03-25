"""
Fetches ALL active markets from Polymarket and Kalshi and saves to JSON.

Requirements:
    pip install requests
"""

import json
import time
import requests
from pathlib import Path
import time
from datetime import datetime, timedelta, timezone


# ── Config ────────────────────────────────────────────────────────────────────
POLY_FILE        = Path("markets/poly_markets.json")
KALSHI_FILE      = Path("markets/kalshi_markets.json")
POLY_PAGE_SIZE   = 500
KALSHI_PAGE_SIZE = 1000
RETRY_DELAYS     = [5, 15, 30, 60]
# one week from today
POLY_CLOSE_DATE  = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
KALSHI_CLOSE_DATE = int(time.time()) + (7 * 24 * 60 * 60)
print(KALSHI_CLOSE_DATE)
# ── Helpers ───────────────────────────────────────────────────────────────────
def get_with_retry(url, params, timeout=15):
    """GET request with exponential backoff on 429 Too Many Requests."""
    for attempt, delay in enumerate([0] + RETRY_DELAYS):
        if delay:
            print(f"    ⏳ Rate limited (429). Waiting {delay}s before retry {attempt}/{len(RETRY_DELAYS)}...")
            time.sleep(delay)
        r = requests.get(url, params=params, timeout=timeout)
        if r.status_code == 429:
            continue
        r.raise_for_status()
        return r
    r = requests.get(url, params=params, timeout=timeout)
    r.raise_for_status()
    return r


# ── Fetch ─────────────────────────────────────────────────────────────────────
def fetch_poly_markets():
    print("Fetching ALL active Polymarket markets...")
    markets  = []
    seen_ids = set()
    offset   = 0
    base_url = "https://gamma-api.polymarket.com/markets"

    while True:
        params = {
            "limit":     POLY_PAGE_SIZE,
            "offset":    offset,
            "active":    "true",
            "closed":    "false",
            "order":     "startDate",
            "ascending": "false",
            "end_date_min": POLY_CLOSE_DATE
        }

        r = get_with_retry(base_url, params)
        page = r.json()

        if not page:
            print("  Polymarket: no more results.")
            break

        raw_page_size = len(page)

        added = 0
        for m in page:
            mid = m.get("id", "")
            if mid in seen_ids:
                continue
            title = (m.get("question") or m.get("groupItemTitle") or "").strip()
            if not title:
                continue
            if not m.get("volumeNum") or m.get("volumeNum") < 10000:
                continue
            clob_ids = json.loads(m.get("clobTokenIds") or "[]")
            seen_ids.add(mid)
            markets.append({
                "title":       title,
                "id":          mid,
                "slug":        m.get("slug", ""),
                "description": (m.get("description") or ""),
                "end_date":    m.get("endDate", ""),
                "category":    m.get("category", ""),
                "liquidity": m.get("liquidity"),
                "fee": m.get("fee"),
                "outcomePrices": m.get("outcomePrices"),
                "volumeNum": m.get("volumeNum"),
                "clob_token_ids": json.loads(m.get("clobTokenIds") or "[]"),
            })
            added += 1

        print(f"  offset={offset:>6} → +{added} new (raw: {raw_page_size}, total: {len(markets)})")

        if raw_page_size < POLY_PAGE_SIZE:
            print("  Polymarket: reached end of results.")
            break

        # if added == 0:
        #     print("  Polymarket: full page but no new markets, stopping.")
        #     break

        offset += POLY_PAGE_SIZE

    print(f"  Final Polymarket count: {len(markets)}\n")
    return markets


def fetch_kalshi_markets():
    print("Fetching ALL active Kalshi markets...")
    markets       = []
    seen_tickers  = set()
    cursor        = None
    base_url      = "https://api.elections.kalshi.com/trade-api/v2/markets"
    pages_fetched = 0
    MAX_PAGES     = 50

    while True:
        params = {
            "limit":  KALSHI_PAGE_SIZE,
            "status": "open",
            "min_close_ts": KALSHI_CLOSE_DATE
        }
        if cursor:
            params["cursor"] = cursor

        r = get_with_retry(base_url, params)
        data = r.json()

        page = data.get("markets", [])
        if not page:
            print("  Kalshi: no more results.")
            break

        raw_page_size = len(page)
        pages_fetched += 1

        added = 0
        dupes = 0
        for m in page:
            ticker = m.get("ticker", "")
            if ticker in seen_tickers:
                dupes += 1
                continue
            title = (m.get("title") or m.get("yes_sub_title") or "").strip()
            if not title:
                continue
            if not m.get("volume_fp") or float(m.get("volume_fp")) < 10000:
                continue
            seen_tickers.add(ticker)
            markets.append({
                "title":        title,
                "ticker":       ticker,
                "event_ticker": m.get("event_ticker", ""),
                "subtitle":     m.get("subtitle", ""),
                "rules":        (m.get("rules_primary") or ""),
                "close_time":   m.get("close_time", ""),
                "status":       m.get("status", ""),
                "volume_fp":       m.get("volume_fp"),
                "rules_primary": m.get("rules_primary"),
                "rules_secondary": m.get("rules_secondary"),
                "yes_ask_dollars": m.get("yes_ask_dollars"),
                "no_ask_dollars": m.get("no_ask_dollars")
            })
            added += 1

        cursor_display = str(cursor)[:24] if cursor else "None"
        print(f"  cursor={cursor_display:>24} → +{added} new, {dupes} dupes (raw: {raw_page_size}, total: {len(markets)})")

        # if pages_fetched >= MAX_PAGES:
        #     print(f"  Kalshi: reached MAX_PAGES ({MAX_PAGES}), stopping.")
        #     break

        cursor = data.get("cursor")
        if not cursor:
            print("  Kalshi: no cursor returned, end of results.")
            break

        if raw_page_size < KALSHI_PAGE_SIZE:
            print("  Kalshi: partial page, end of results.")
            break

        if dupes > raw_page_size // 2:
            print(f"  Kalshi: {dupes}/{raw_page_size} dupes on last page — likely cycling, stopping.")
            break

        # if added == 0:
        #     print("  Kalshi: full page but no new markets, stopping.")
        #     break

    print(f"  Final Kalshi count: {len(markets)}\n")
    return markets


# ── Save ──────────────────────────────────────────────────────────────────────
def save(data, path):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Saved → {path}")


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    poly_markets   = fetch_poly_markets()
    kalshi_markets = fetch_kalshi_markets()
    save(poly_markets,   POLY_FILE)
    save(kalshi_markets, KALSHI_FILE)
    print(f"\nDone. {len(poly_markets)} Polymarket + {len(kalshi_markets)} Kalshi markets saved.")