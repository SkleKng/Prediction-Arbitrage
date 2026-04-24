"""
Paper-trade (simulate) Kalshi + Polymarket arb legs using live WebSocket prices from ws_price_monitoring.

Run from python-src (same cwd as matches/ and prices/):
  python paper_trade_sim.py

State is persisted to paper_trading/paper_state.json (override with PAPER_STATE_FILE).
Requires .env Kalshi credentials for the Kalshi WS (same as ws_price_monitoring).
"""
from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

STATE_DIR = Path(__file__).resolve().parent / "paper_trading"
DEFAULT_STATE_FILE = STATE_DIR / "paper_state.json"
STATE_FILE = Path(os.getenv("PAPER_STATE_FILE", str(DEFAULT_STATE_FILE)))

INITIAL_CASH_USD = float(os.getenv("PAPER_INITIAL_CASH", "100000"))
CONTRACTS_PER_ARB = max(1, int(os.getenv("PAPER_CONTRACTS", "1")))
COOLDOWN_SEC = float(os.getenv("PAPER_COOLDOWN_SEC", "120"))


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _atomic_write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)


@dataclass
class OpenPosition:
    trade_id: str
    opened_at: str
    match: str
    strategy: str
    contracts: int
    cost_basis_usd: float
    expected_payout_usd: float
    expected_profit_usd: float


@dataclass
class PaperState:
    version: int = 1
    wallet: dict[str, Any] = field(default_factory=dict)
    trades: list[dict[str, Any]] = field(default_factory=list)
    open_positions: list[dict[str, Any]] = field(default_factory=list)
    _cooldown_until: dict[str, float] = field(default_factory=dict)

    @staticmethod
    def default_wallet() -> dict[str, Any]:
        return {
            "cash_usd": INITIAL_CASH_USD,
            "initial_cash_usd": INITIAL_CASH_USD,
            "created_at": _utc_now_iso(),
            "updated_at": _utc_now_iso(),
        }

    @classmethod
    def load(cls, path: Path) -> PaperState:
        if not path.exists():
            s = cls(wallet=cls.default_wallet())
            s.save(path)
            return s
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
        cooldown = raw.pop("_cooldown_until", {})
        st = cls(
            version=raw.get("version", 1),
            wallet=raw.get("wallet") or cls.default_wallet(),
            trades=raw.get("trades") or [],
            open_positions=raw.get("open_positions") or [],
            _cooldown_until={k: float(v) for k, v in cooldown.items()},
        )
        for key in ("cash_usd", "initial_cash_usd"):
            if key not in st.wallet:
                st.wallet[key] = INITIAL_CASH_USD
        return st

    def save(self, path: Path) -> None:
        payload = {
            "version": self.version,
            "wallet": self.wallet,
            "trades": self.trades,
            "open_positions": self.open_positions,
            "_cooldown_until": self._cooldown_until,
        }
        self.wallet["updated_at"] = _utc_now_iso()
        _atomic_write_json(path, payload)


class PaperTrader:
    def __init__(self, state_path: Path):
        self.state_path = state_path
        self.state = PaperState.load(state_path)

    def _cooldown_key(self, opp: dict) -> str:
        return f"{opp.get('match', '')}::{opp.get('strategy', '')}"

    def try_execute(self, opp: dict) -> None:
        from ws_price_monitoring import effective_buy_cost

        key = self._cooldown_key(opp)
        now = time.monotonic()
        until = self.state._cooldown_until.get(key, 0.0)
        if now < until:
            return

        strategy = opp.get("strategy")
        contracts = CONTRACTS_PER_ARB
        total_per_contract = float(opp["total_cost"])
        total_cost = round(total_per_contract * contracts, 6)
        cash = float(self.state.wallet.get("cash_usd", 0.0))
        if cash < total_cost:
            print(f"[paper] skip (insufficient cash ${cash:.2f} < ${total_cost:.2f}) | {key[:80]}")
            return

        if strategy == "YES_poly_NO_kalshi":
            legs = [
                {
                    "venue": "polymarket",
                    "side": "YES",
                    "raw_price": float(opp["poly_yes_ask"]),
                    "all_in_per_contract_usd": round(
                        effective_buy_cost(float(opp["poly_yes_ask"]), "poly"), 6
                    ),
                },
                {
                    "venue": "kalshi",
                    "side": "NO",
                    "raw_price": float(opp["kalshi_no_cost_raw"]),
                    "all_in_per_contract_usd": round(
                        effective_buy_cost(float(opp["kalshi_no_cost_raw"]), "kalshi"), 6
                    ),
                },
            ]
        elif strategy == "YES_kalshi_NO_poly":
            legs = [
                {
                    "venue": "kalshi",
                    "side": "YES",
                    "raw_price": float(opp["kalshi_yes_ask"]),
                    "all_in_per_contract_usd": round(
                        effective_buy_cost(float(opp["kalshi_yes_ask"]), "kalshi"), 6
                    ),
                },
                {
                    "venue": "polymarket",
                    "side": "NO",
                    "raw_price": float(opp["poly_no_ask"]),
                    "all_in_per_contract_usd": round(
                        effective_buy_cost(float(opp["poly_no_ask"]), "poly"), 6
                    ),
                },
            ]
        else:
            print(f"[paper] unknown strategy {strategy!r}, skip")
            return

        trade_id = str(uuid.uuid4())
        expected_payout = float(contracts)
        expected_profit = round(expected_payout - total_cost, 6)

        trade_record = {
            "trade_id": trade_id,
            "executed_at": opp.get("timestamp") or _utc_now_iso(),
            "match": opp.get("match"),
            "strategy": strategy,
            "contracts": contracts,
            "total_cost_per_contract_usd": round(total_per_contract, 6),
            "total_cost_usd": total_cost,
            "expected_payout_usd": expected_payout,
            "expected_profit_usd": expected_profit,
            "legs": legs,
            "signal_snapshot": {
                "total_cost": opp.get("total_cost"),
                "profit_per_contract": opp.get("profit_per_contract"),
                "profit_pct": opp.get("profit_pct"),
                "poly_yes_ask": opp.get("poly_yes_ask"),
                "poly_no_ask": opp.get("poly_no_ask"),
                "kalshi_yes_ask": opp.get("kalshi_yes_ask"),
                "kalshi_yes_bid": opp.get("kalshi_yes_bid"),
                "kalshi_no_cost_raw": opp.get("kalshi_no_cost_raw"),
            },
        }

        self.state.wallet["cash_usd"] = round(cash - total_cost, 6)
        self.state.trades.append(trade_record)
        pos = OpenPosition(
            trade_id=trade_id,
            opened_at=trade_record["executed_at"],
            match=str(opp.get("match", "")),
            strategy=str(strategy),
            contracts=contracts,
            cost_basis_usd=total_cost,
            expected_payout_usd=expected_payout,
            expected_profit_usd=expected_profit,
        )
        self.state.open_positions.append(asdict(pos))
        self.state._cooldown_until[key] = now + COOLDOWN_SEC
        self.state.save(self.state_path)

        print(
            f"[paper] TRADE {trade_id[:8]}… | {strategy} x{contracts} | "
            f"cost ${total_cost:.4f} | cash ${self.state.wallet['cash_usd']:.2f}"
        )


def main() -> None:
    import ws_price_monitoring as wpm

    trader = PaperTrader(STATE_FILE)
    wpm.register_arb_callback(trader.try_execute)

    api_key = wpm.KALSHI_API_KEY
    private_key = wpm.KALSHI_PRIVATE_KEY
    if not api_key or not private_key:
        raise SystemExit("Set KALSHI_API_KEY and KALSHI_PRIVATE_KEY in .env for Kalshi WebSocket auth.")

    print(f"[paper] state file: {STATE_FILE.resolve()}")
    print(
        f"[paper] cash ${float(trader.state.wallet.get('cash_usd', 0)):.2f} | "
        f"contracts/arb {CONTRACTS_PER_ARB} | cooldown {COOLDOWN_SEC}s"
    )

    asyncio.run(wpm.main(api_key, private_key))


if __name__ == "__main__":
    main()
