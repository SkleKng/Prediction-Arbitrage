"""
Polymarket vs Kalshi — Market Matching Benchmark
Fetches ALL active markets from each platform, saves to JSON,
then benchmarks fuzzy matching vs sentence embeddings at multiple thresholds.

Requirements:
    pip install requests rapidfuzz sentence-transformers numpy torch
"""

import json
import time
import requests
from pathlib import Path
from rapidfuzz import fuzz, process, utils
from sentence_transformers import SentenceTransformer, util
import numpy as np
import torch

# ── Config ────────────────────────────────────────────────────────────────────
POLY_FILE        = Path("poly_markets.json")
KALSHI_FILE      = Path("kalshi_markets.json")
EMBED_MODEL      = "all-mpnet-base-v2"
POLY_PAGE_SIZE   = 500                # Polymarket max per request
KALSHI_PAGE_SIZE = 1000               # Kalshi max per request
FUZZY_THRESHOLDS  = [90]
EMBED_THRESHOLDS  = [0.9]
FUZZY_OUTPUT_FILE = Path("fuzzy_matches.json")
EMBED_OUTPUT_FILE = Path("embed_matches.json")
RETRY_DELAYS     = [5, 15, 30, 60]   # seconds to wait on 429, progressively longer

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
    # Final attempt after all delays exhausted
    r = requests.get(url, params=params, timeout=timeout)
    r.raise_for_status()
    return r


# ── 1. Fetch markets ──────────────────────────────────────────────────────────
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
            seen_ids.add(mid)
            markets.append({
                "title":       title,
                "id":          mid,
                "slug":        m.get("slug", ""),
                "description": (m.get("description") or "")[:300],
                "end_date":    m.get("endDate", ""),
                "category":    m.get("category", ""),
            })
            added += 1

        print(f"  offset={offset:>6} → +{added} new (raw: {raw_page_size}, total: {len(markets)})")

        if raw_page_size < POLY_PAGE_SIZE:
            print("  Polymarket: reached end of results.")
            break

        if added == 0:
            print("  Polymarket: full page but no new markets, stopping.")
            break

        offset += POLY_PAGE_SIZE

    print(f"  Final Polymarket count: {len(markets)}\n")
    return markets


def fetch_kalshi_markets():
    print("Fetching ALL active Kalshi markets...")
    markets        = []
    seen_tickers   = set()
    cursor         = None
    base_url       = "https://api.elections.kalshi.com/trade-api/v2/markets"
    pages_fetched  = 0
    MAX_PAGES      = 50   # 50 x 1000 = 50,000 markets max — well above reality

    while True:
        params = {
            "limit":  KALSHI_PAGE_SIZE,
            "status": "open",
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
            seen_tickers.add(ticker)
            markets.append({
                "title":        title,
                "ticker":       ticker,
                "event_ticker": m.get("event_ticker", ""),
                "subtitle":     m.get("subtitle", ""),
                "rules":        (m.get("rules_primary") or "")[:300],
                "close_time":   m.get("close_time", ""),
                "status":       m.get("status", ""),
            })
            added += 1

        cursor_display = str(cursor)[:24] if cursor else "None"
        print(f"  cursor={cursor_display:>24} → +{added} new, {dupes} dupes (raw: {raw_page_size}, total: {len(markets)})")

        # Hard page cap — prevents runaway pagination
        if pages_fetched >= MAX_PAGES:
            print(f"  Kalshi: reached MAX_PAGES ({MAX_PAGES}), stopping.")
            break

        cursor = data.get("cursor")
        if not cursor:
            print("  Kalshi: no cursor returned, end of results.")
            break

        if raw_page_size < KALSHI_PAGE_SIZE:
            print("  Kalshi: partial page, end of results.")
            break

        # If more than half the page was dupes, we're likely cycling
        if dupes > raw_page_size // 2:
            print(f"  Kalshi: {dupes}/{raw_page_size} dupes on last page — likely cycling, stopping.")
            break

        if added == 0:
            print("  Kalshi: full page but no new markets, stopping.")
            break

    print(f"  Final Kalshi count: {len(markets)}\n")
    return markets


# ── 2. Save / load ────────────────────────────────────────────────────────────
def save(data, path):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Saved → {path}")

def load(path):
    with open(path) as f:
        return json.load(f)


# ── 3. Fuzzy matching ─────────────────────────────────────────────────────────
def run_fuzzy(poly_titles, kalshi_titles, threshold):
    """
    High-performance matching using RapidFuzz C++ backend.
    Matches 1000x1000 titles in milliseconds.
    """
    # 1. Pre-process titles once to avoid redundant work (lowercase, trim, alphanumeric)
    # This is critical for token_sort_ratio as it sorts words internally.
    clean_poly = [utils.default_process(t) for t in poly_titles]
    clean_kalshi = [utils.default_process(t) for t in kalshi_titles]

    # 2. Vectorized distance calculation (returns a 2D NumPy-like array)
    # workers=-1 uses all CPU cores
    print(f"  Calculating {len(clean_poly) * len(clean_kalshi):,} comparisons on 4 cores...")
    score_matrix = process.cdist(
        clean_poly, 
        clean_kalshi, 
        scorer=fuzz.token_sort_ratio, 
        workers=4
    )

    # 3. Extract best matches from the matrix
    matches = []
    for i, poly_title in enumerate(poly_titles):
        # Find the index of the highest score in this row
        best_j = np.argmax(score_matrix[i])
        best_score = score_matrix[i][best_j]
        
        if best_score >= threshold:
            matches.append((poly_title, kalshi_titles[best_j], best_score))
            
    return matches


# ── 4. Embedding matching ─────────────────────────────────────────────────────
def run_embedding_matrix(poly_titles, kalshi_titles, model):
    """Encode both lists once, return full cosine similarity matrix."""
    print("  Encoding Polymarket titles...")
    poly_emb   = model.encode(poly_titles,   convert_to_tensor=True, show_progress_bar=True)
    print("  Encoding Kalshi titles...")
    kalshi_emb = model.encode(kalshi_titles, convert_to_tensor=True, show_progress_bar=True)
    print("  Computing cosine similarity matrix...")
    scores     = util.cos_sim(poly_emb, kalshi_emb)
    return scores

def apply_embed_threshold(poly_titles, kalshi_titles, scores, threshold):
    matches = []
    for i, p in enumerate(poly_titles):
        best_j = torch.argmax(scores[i]).item()
        score  = scores[i][best_j].item()
        if score >= threshold:
            matches.append((p, kalshi_titles[best_j], round(score, 4)))
    return matches


# ── 5. Print results ──────────────────────────────────────────────────────────
def print_matches(matches, label, threshold, elapsed_ms):
    print(f"\n  [{label} @ threshold={threshold}]  "
          f"{len(matches)} matches  |  {elapsed_ms:.1f}ms")
    for p, k, s in matches[:10]:
        p_short = (p[:55] + "..") if len(p) > 55 else p
        k_short = (k[:55] + "..") if len(k) > 55 else k
        print(f"    [{s:>6}]  {p_short:<57} ↔  {k_short}")
    if len(matches) > 10:
        print(f"    ... and {len(matches) - 10} more")

def save_matches(all_matches, path):
    """Save all threshold results to a single JSON file."""
    output = []
    for threshold, matches in all_matches.items():
        output.append({
            "threshold": threshold,
            "count":     len(matches),
            "matches":   [
                {"polymarket": p, "kalshi": k, "score": float(s)}
                for p, k, s in matches
            ]
        })
    with open(path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Saved → {path} ({sum(len(m['matches']) for m in output)} total matches across {len(output)} thresholds)")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if POLY_FILE.exists() and KALSHI_FILE.exists():
        print("Loading cached market files...")
        poly_markets   = load(POLY_FILE)
        kalshi_markets = load(KALSHI_FILE)
    else:
        poly_markets   = fetch_poly_markets()
        kalshi_markets = fetch_kalshi_markets()
        save(poly_markets,   POLY_FILE)
        save(kalshi_markets, KALSHI_FILE)

    poly_titles   = [m["title"] for m in poly_markets]
    kalshi_titles = [m["title"] for m in kalshi_markets]

    print(f"\n{'='*80}")
    print(f"  BENCHMARK: {len(poly_titles)} Polymarket  ×  {len(kalshi_titles)} Kalshi markets")
    print(f"  = {len(poly_titles) * len(kalshi_titles):,} pairs to compare")
    print(f"{'='*80}")

    # ── Fuzzy benchmark ───────────────────────────────────────────────────────
    print("\n── FUZZY MATCHING (token_sort_ratio) ──────────────────────────────────────")
    fuzzy_all = {}
    for threshold in FUZZY_THRESHOLDS:
        t0      = time.perf_counter()
        matches = run_fuzzy(poly_titles, kalshi_titles, threshold)
        elapsed = (time.perf_counter() - t0) * 1000
        print_matches(matches, "FUZZY", threshold, elapsed)
        fuzzy_all[threshold] = matches
    save_matches(fuzzy_all, FUZZY_OUTPUT_FILE)

    # ── Embedding benchmark ───────────────────────────────────────────────────
    print("\n── EMBEDDING MATCHING (all-mpnet-base-v2) ─────────────────────────────────")
    print("  Loading model...")
    t0    = time.perf_counter()
    model = SentenceTransformer(EMBED_MODEL)
    print(f"  Model loaded in {(time.perf_counter() - t0) * 1000:.0f}ms\n")

    t0     = time.perf_counter()
    scores = run_embedding_matrix(poly_titles, kalshi_titles, model)
    t_enc  = (time.perf_counter() - t0) * 1000
    print(f"  Encode + similarity matrix: {t_enc:.1f}ms")

    embed_all = {}
    for threshold in EMBED_THRESHOLDS:
        t0      = time.perf_counter()
        matches = apply_embed_threshold(poly_titles, kalshi_titles, scores, threshold)
        elapsed = (time.perf_counter() - t0) * 1000
        print_matches(matches, "EMBED", threshold, elapsed)
        embed_all[threshold] = matches
    save_matches(embed_all, EMBED_OUTPUT_FILE)


if __name__ == "__main__":
    main()