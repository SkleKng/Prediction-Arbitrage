"""
Polymarket vs Kalshi — Market Matching
Loads market JSONs produced by get_all_markets.py, then runs
fuzzy matching and embedding matching, saving results to JSON.

Requirements:
    pip install rapidfuzz sentence-transformers numpy torch
"""

import json
import time
import numpy as np
import torch
from pathlib import Path
from rapidfuzz import fuzz, process, utils
from sentence_transformers import SentenceTransformer, util

# ── Config ────────────────────────────────────────────────────────────────────
POLY_FILE         = Path("poly_markets.json")
KALSHI_FILE       = Path("kalshi_markets.json")
EMBED_MODEL       = "all-mpnet-base-v2"
FUZZY_THRESHOLDS  = [90]
EMBED_THRESHOLDS  = [0.9]
FUZZY_OUTPUT_FILE = Path("fuzzy_matches.json")
EMBED_OUTPUT_FILE = Path("embed_matches.json")


# ── Load ──────────────────────────────────────────────────────────────────────
def load(path):
    with open(path) as f:
        return json.load(f)


# ── Fuzzy matching ────────────────────────────────────────────────────────────
def run_fuzzy(poly_titles, kalshi_titles, threshold):
    """
    High-performance matching using RapidFuzz C++ backend.
    Matches 1000x1000 titles in milliseconds.
    """
    clean_poly   = [utils.default_process(t) for t in poly_titles]
    clean_kalshi = [utils.default_process(t) for t in kalshi_titles]

    print(f"  Calculating {len(clean_poly) * len(clean_kalshi):,} comparisons on 4 cores...")
    score_matrix = process.cdist(
        clean_poly,
        clean_kalshi,
        scorer=fuzz.token_sort_ratio,
        workers=4
    )

    matches = []
    for i, poly_title in enumerate(poly_titles):
        best_j     = np.argmax(score_matrix[i])
        best_score = score_matrix[i][best_j]
        if best_score >= threshold:
            matches.append((poly_title, kalshi_titles[best_j], best_score))

    return matches


# ── Embedding matching ────────────────────────────────────────────────────────
def run_embedding_matrix(poly_titles, kalshi_titles, model):
    """Encode both lists once, return full cosine similarity matrix."""
    print("  Encoding Polymarket titles...")
    poly_emb   = model.encode(poly_titles,   convert_to_tensor=True, show_progress_bar=True)
    print("  Encoding Kalshi titles...")
    kalshi_emb = model.encode(kalshi_titles, convert_to_tensor=True, show_progress_bar=True)
    print("  Computing cosine similarity matrix...")
    return util.cos_sim(poly_emb, kalshi_emb)

def apply_embed_threshold(poly_titles, kalshi_titles, scores, threshold):
    matches = []
    for i, p in enumerate(poly_titles):
        best_j = torch.argmax(scores[i]).item()
        score  = scores[i][best_j].item()
        if score >= threshold:
            matches.append((p, kalshi_titles[best_j], round(score, 4)))
    return matches


# ── Print / save results ──────────────────────────────────────────────────────
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
if __name__ == "__main__":
    print("Loading market files...")
    poly_markets   = load(POLY_FILE)
    kalshi_markets = load(KALSHI_FILE)

    poly_titles   = [m["title"] for m in poly_markets]
    kalshi_titles = [m["title"] for m in kalshi_markets]

    print(f"\n{'='*80}")
    print(f"  BENCHMARK: {len(poly_titles)} Polymarket  ×  {len(kalshi_titles)} Kalshi markets")
    print(f"  = {len(poly_titles) * len(kalshi_titles):,} pairs to compare")
    print(f"{'='*80}")

    # ── Fuzzy ─────────────────────────────────────────────────────────────────
    # print("\n── FUZZY MATCHING (token_sort_ratio) ──────────────────────────────────────")
    # fuzzy_all = {}
    # for threshold in FUZZY_THRESHOLDS:
    #     t0      = time.perf_counter()
    #     matches = run_fuzzy(poly_titles, kalshi_titles, threshold)
    #     elapsed = (time.perf_counter() - t0) * 1000
    #     print_matches(matches, "FUZZY", threshold, elapsed)
    #     fuzzy_all[threshold] = matches
    # save_matches(fuzzy_all, FUZZY_OUTPUT_FILE)

    # ── Embedding ─────────────────────────────────────────────────────────────
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