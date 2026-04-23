import json
import re
from pathlib import Path


INPUT_PATH = Path("matches/embed_matches.json")
OUTPUT_PATH = Path("matches/ai_matches.json")


CHECKPOINT_PATTERNS = (
    "at the end of",
    "end of april",
    "end of may",
    "end of june",
    "end of july",
    "end of august",
    "end of september",
    "end of october",
    "end of november",
    "end of december",
    "when the table",
    "when checked on",
    "market close on",
    "at market close",
    "after the july",
    "after the june",
    "after the september",
    "after the meeting",
)

ONGOING_PATTERNS = (
    "before ",
    "by ",
    "becomes law",
    "wins the nomination",
    "officially declared the winner",
    "ipo first",
)


def normalize(text):
    if not text:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def parse_price_list(raw_value):
    if raw_value is None:
        return None, None
    try:
        values = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
    except json.JSONDecodeError:
        return None, None

    if not isinstance(values, list) or len(values) < 2:
        return None, None

    try:
        return float(values[0]), float(values[1])
    except (TypeError, ValueError):
        return None, None


def parse_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def combined_text(poly, kalshi):
    parts = [
        poly.get("title", ""),
        poly.get("description", ""),
        kalshi.get("title", ""),
        kalshi.get("rules", ""),
        kalshi.get("rules_primary", ""),
    ]
    return normalize(" ".join(parts))


def has_checkpoint_style(poly):
    text = normalize(f"{poly.get('title', '')} {poly.get('description', '')}")
    return any(pattern in text for pattern in CHECKPOINT_PATTERNS)


def has_ongoing_style(kalshi):
    text = normalize(f"{kalshi.get('title', '')} {kalshi.get('rules', '')}")
    return any(pattern in text for pattern in ONGOING_PATTERNS)


def extract_dates(text):
    normalized = normalize(text)
    return re.findall(r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2} \d{4}\b", normalized)


def date_gap_is_small(poly, kalshi):
    poly_dates = extract_dates(f"{poly.get('title', '')} {poly.get('description', '')}")
    kalshi_dates = extract_dates(f"{kalshi.get('title', '')} {kalshi.get('rules', '')}")
    if not poly_dates or not kalshi_dates:
        return True
    return poly_dates[0] == kalshi_dates[0] or (
        poly_dates[0].endswith("2026") and kalshi_dates[0].endswith("2027")
    )


def same_market(poly, kalshi):
    poly_title = normalize(poly.get("title", ""))
    kalshi_title = normalize(kalshi.get("title", ""))
    if poly_title == kalshi_title:
        return "yes"

    combined = combined_text(poly, kalshi)

    if "ipo first" in combined:
        key_terms = ("anthropic", "openai")
        return "yes" if all(term in combined for term in key_terms) else "no"

    if "save act" in combined and "h r 22" in combined:
        return "yes"

    checkpoint_conflict = has_checkpoint_style(poly) and has_ongoing_style(kalshi)
    if checkpoint_conflict and not date_gap_is_small(poly, kalshi):
        return "no"

    poly_words = set(poly_title.split())
    kalshi_words = set(kalshi_title.split())
    overlap = len(poly_words & kalshi_words)
    min_size = min(len(poly_words), len(kalshi_words)) or 1
    return "yes" if overlap / min_size >= 0.6 else "no"


def resolved_status(poly, kalshi):
    text = combined_text(poly, kalshi)
    explicit_outcome_markers = (
        "resolved to yes",
        "resolved to no",
        "settled yes",
        "settled no",
        "winner was",
        "won the nomination",
        "signed into law on",
        "officially declared the winner on",
    )
    return "yes" if any(marker in text for marker in explicit_outcome_markers) else "no"


def arbitrage_status(output):
    if output["same_market"] != "yes" or output["resolved_status"] != "no":
        return "no"

    poly_yes = output["polymarket_yes_price"]
    poly_no = output["polymarket_no_price"]
    kalshi_yes = output["kalshi_yes_ask"]
    kalshi_no = output["kalshi_no_ask"]

    gaps = []
    if poly_yes is not None and kalshi_yes is not None:
        gaps.append(abs(poly_yes - kalshi_yes))
    if poly_no is not None and kalshi_no is not None:
        gaps.append(abs(poly_no - kalshi_no))

    return "yes" if gaps and max(gaps) >= 0.005 else "no"


def transform_match(match):
    poly = match.get("polymarket", {})
    kalshi = match.get("kalshi", {})
    poly_yes, poly_no = parse_price_list(poly.get("outcomePrices"))

    output = {
        "same_market": same_market(poly, kalshi),
        "resolved_status": resolved_status(poly, kalshi),
        "polymarket_title": poly.get("title"),
        "polymarket_id": poly.get("id"),
        "polymarket_slug": poly.get("slug"),
        "clob_token_ids": poly.get("clob_token_ids"),
        "polymarket_volume": parse_float(poly.get("volumeNum")),
        "polymarket_yes_price": poly_yes,
        "polymarket_no_price": poly_no,
        "kalshi_title": kalshi.get("title"),
        "kalshi_ticker": kalshi.get("ticker"),
        "kalshi_event_ticker": kalshi.get("event_ticker"),
        "event_ticker_volume": parse_float(kalshi.get("volume_fp")),
        "arbitrage_status": "no",
        "kalshi_yes_ask": parse_float(kalshi.get("yes_ask_dollars")),
        "kalshi_no_ask": parse_float(kalshi.get("no_ask_dollars")),
    }
    output["arbitrage_status"] = arbitrage_status(output)
    return output


def main():
    payload = json.loads(INPUT_PATH.read_text(encoding="utf-8"))
    output = []

    for bucket in payload:
        transformed_matches = [transform_match(match) for match in bucket.get("matches", [])]
        output.append(
            {
                "threshold": bucket.get("threshold"),
                "count": len(transformed_matches),
                "matches": transformed_matches,
            }
        )

    OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
