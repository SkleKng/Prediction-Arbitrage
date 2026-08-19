# Prediction Market Arbitrage

A cross-venue arbitrage engine for prediction markets. It ingests every active market on **Polymarket** and **Kalshi**, figures out which contracts on the two venues are actually the *same* real-world question, streams live order-book prices for those pairs over WebSockets, and flags fee-adjusted arbitrage opportunities in real time — with a paper-trading simulator, execution clients for both venues, and a live terminal-style dashboard on top.

Built as a research project for **UTD FinTech** (the University of Texas at Dallas FinTech organization) during the Spring 2026 research cycle. The project explores a real market-microstructure question: prediction markets are fragmented across venues with different fee models, settlement rails (Kalshi is a CFTC-regulated exchange; Polymarket settles on-chain on Polygon), and user bases — so identical event contracts routinely trade at different prices.

> **Disclaimer:** This is an educational research project, not financial advice or production trading software. Trade at your own risk.

## How it works

The hard problem isn't spotting a price gap — it's knowing that two differently-worded contracts resolve on the same event. The pipeline narrows thousands of markets down in stages, each stage cheaper-to-stronger:

```
 Polymarket Gamma API          Kalshi REST API
        └──────────┬──────────────────┘
                   ▼
        1. Market ingestion            get_markets.py
                   ▼
        2. Candidate matching          embedding_matching.py
           • RapidFuzz token-sort fuzzy matching
           • Sentence-transformer embeddings (all-mpnet-base-v2)
                   ▼
        3. LLM verification            build_embed_match_outputs.py
           • Gemini 2.5 Flash judges whether paraphrased
             titles + rules resolve identically
           • Resolution-timing heuristics (checkpoint vs. ongoing)
                   ▼
        4. Live price monitoring       ws_price_monitoring.py
           • Kalshi WS (RSA-PSS signed auth) + Polymarket CLOB WS
           • Fee-aware arb detection across YES/NO legs
                   ▼
   ┌───────────────┼────────────────────┐
   ▼               ▼                    ▼
 Paper trading   Execution          Dashboard
 paper_trade_    kalshi_order.py    Next.js frontend
 sim.py          poly_execution.py  (live feed + AI match visualizer)
```

**Fee-aware edge.** A raw price gap isn't an arb. The monitor prices both legs against each venue's actual taker fees — Kalshi's `⌈0.07 · C · P(1−P)⌉` per-contract fee and Polymarket's flat taker rate — and only surfaces pairs where buying YES on one venue and NO on the other costs less than $1.00 total, i.e. a guaranteed profit at settlement (conditional on the match being correct — which is exactly why stage 3 exists).

**Matching quality.** Fuzzy string matching alone produces heavy false positives ("Will X win by March?" vs. "Will X win by June?"), and embeddings alone can't distinguish resolution criteria. The LLM verification stage reads both markets' full rules and prices, judges semantic equivalence, and filters out checkpoint-vs-ongoing timing mismatches that would break the hedge.

## Repo layout

```
python-src/          The arbitrage engine
  get_markets.py               Pull all active markets from both venues (paginated, rate-limit backoff)
  embedding_matching.py        Fuzzy + embedding candidate matching
  build_embed_match_outputs.py Gemini-verified match set → matches/ai_matches.json
  ws_price_monitoring.py       Live WS prices + fee-adjusted arb detection
  paper_trade_sim.py           Paper-trading simulator with persistent P&L state
  kalshi_order.py              Kalshi order placement (RSA-PSS request signing)
  poly_execution.py            Polymarket CLOB order execution (py-clob-client)
  approve_polymarket.py        One-time USDC approval on Polygon for the CLOB exchange
  summarize_results.py         Match/arb summary stats
  markets/  matches/           Sample pipeline outputs (market snapshots, verified matches)

frontend/            Next.js dashboard — live arbitrage feed, spread charts,
                     and an AI match-reconciliation visualizer, reading the
                     engine's JSON outputs through API routes

run.sh               Launches the price monitor + frontend together
```

## Running it

**Engine** (Python 3.13+, [uv](https://docs.astral.sh/uv/)):

```bash
cd python-src
uv sync
```

Create `python-src/.env`:

```ini
# Kalshi (API key + RSA private key from account settings)
KALSHI_API_KEY=...
KALSHI_PRIVATE_KEY=...   # PEM; also used as KALSHI_API_SECRET by kalshi_order.py

# Gemini match verification
GOOGLE_API_KEY=...

# Only needed for live Polymarket execution
POLY_PRIVATE_KEY=...
WALLET_ADDRESS=...
```

Then run the pipeline in order:

```bash
uv run get_markets.py                  # fetch all active markets
uv run embedding_matching.py           # fuzzy + embedding candidates
uv run build_embed_match_outputs.py    # Gemini-verified matches
uv run ws_price_monitoring.py          # live prices + arb feed
uv run paper_trade_sim.py              # optional: paper-trade the arb feed
```

**Dashboard:**

```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

Or launch monitor + dashboard together from the repo root with `./run.sh`.

## Findings

On the snapshot committed in `python-src/markets/` and `python-src/matches/`, the pipeline took ~3,300 active Polymarket markets and ~4,300 active Kalshi markets down to 676 embedding candidates (108 by fuzzy matching alone), of which the Gemini verifier confirmed 245 true cross-venue pairs — 220 of them showing a raw price discrepancy at snapshot time. Confirmed edges are typically small and concentrated in lower-liquidity political and pop-culture markets, and they decay as books refresh — which is what makes WebSocket monitoring (rather than REST polling) matter.
