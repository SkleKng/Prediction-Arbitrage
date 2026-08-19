#!/usr/bin/env bash
# Launches the Python WS price monitor + Next.js frontend together.
# Ctrl+C stops both cleanly.

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
PY_DIR="$ROOT/python-src"
FE_DIR="$ROOT/frontend"
LOG_DIR="$ROOT/.run-logs"
mkdir -p "$LOG_DIR"

if [ ! -d "$PY_DIR/.venv" ]; then
  echo "❌ python-src/.venv not found. Run: cd python-src && uv sync   (or python -m venv .venv && pip install -r ...)"
  exit 1
fi

if [ ! -d "$FE_DIR/node_modules" ]; then
  echo "📦 Installing frontend deps..."
  (cd "$FE_DIR" && npm install)
fi

echo "▶️  Starting Python WS price monitor (logs: $LOG_DIR/ws.log)"
(
  cd "$PY_DIR"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  exec python ws_price_monitoring.py
) >"$LOG_DIR/ws.log" 2>&1 &
WS_PID=$!

cleanup() {
  echo ""
  echo "🛑 Shutting down..."
  if kill -0 "$WS_PID" 2>/dev/null; then
    kill "$WS_PID" 2>/dev/null || true
    wait "$WS_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup INT TERM

sleep 1
if ! kill -0 "$WS_PID" 2>/dev/null; then
  echo "❌ Python WS exited immediately. Tail of log:"
  tail -n 40 "$LOG_DIR/ws.log"
  exit 1
fi

echo "▶️  Starting Next.js dev server on http://localhost:3000"
echo "    (WS PID: $WS_PID — streaming to python-src/prices/live_prices.json)"
echo ""

cd "$FE_DIR"
npm run dev

cleanup
