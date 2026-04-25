import json
import os
import re
from pathlib import Path
import time


INPUT_PATH = Path("matches/embed_matches.json")
OUTPUT_PATH = Path("matches/ai_matches.json")
ENV_PATH = Path(".env")


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


GEMINI_CACHE = {}


def read_env_value(name):
    if not ENV_PATH.exists():
        return None

    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == name:
            return value.strip().strip('"').strip("'")
    return None


GOOGLE_API_KEY = (
    os.getenv("GOOGLE_API_KEY")
    or read_env_value("GOOGLE_API_KEY")
    or "AQ.Ab8RN6LfYYftPH-eYORfGpsHhVyc-zaJHBlI2jjGx0QvIydP3Q"
)


def gemini_market_text(poly, kalshi):
    poly_text = "\n".join(
        part
        for part in (
            f"Title: {poly.get('title', '')}",
            f"Description: {poly.get('description', '')}",
        )
        if part.strip()
    )
    kalshi_text = "\n".join(
        part
        for part in (
            f"Title: {kalshi.get('title', '')}",
            f"Rules: {kalshi.get('rules', '')}",
            f"Primary rules: {kalshi.get('rules_primary', '')}",
        )
        if part.strip()
    )
    return poly_text, kalshi_text


def gemini_cache_key(poly, kalshi):
    poly_text, kalshi_text = gemini_market_text(poly, kalshi)
    return poly_text, kalshi_text

def batch_check_with_gemini(pairs_batch):
    import google.genai as genai
    from google.genai import types
    
    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    prompt = "Are the following pairs of prediction market questions asking the exact same thing, including the same event, outcome, and resolution criteria, even if worded differently? Return a JSON array of strings, where each string is exactly 'yes' or 'no', corresponding to the pairs in order. For example: [\"yes\", \"no\", \"yes\"].\n\n"
    for i, (p, k) in enumerate(pairs_batch):
        prompt += f'Pair {i}:\nPolymarket:\n{p}\n\nKalshi:\n{k}\n\n'
        
    # Wait if we hit free tier limits (tokens or RPM)
    max_retries = 3
    for _ in range(max_retries):
        try:
            time.sleep(5)  # Base sleep between batches
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            text = response.text
            
            # Use regex to find the JSON array inside the response
            match = re.search(r'\[.*?\]', text, re.DOTALL)
            if match:
                text = match.group(0)
            
            results = json.loads(text)
            
            if not isinstance(results, list):
                results = ["no"] * len(pairs_batch)
            while len(results) < len(pairs_batch):
                results.append("no")
            return [str(r).lower() for r in results[:len(pairs_batch)]]
            
        except Exception as e:
            print(f"Gemini API error in batch: {e}")
            error_message = str(e)
            if (
                "GenerateRequestsPerDayPerProjectPerModel-FreeTier" in error_message
                or "prepayment credits are depleted" in error_message
            ):
                raise RuntimeError("Gemini quota is exhausted; ai_matches.json was not updated.") from e
            if '429' in error_message:
                print("Rate limit hit, sleeping for 60 seconds...")
                time.sleep(60)
                continue
            time.sleep(5) # Small sleep on error before retry
            
    raise RuntimeError("Gemini API failed after retries; refusing to write non-AI matches.")


def same_market(poly, kalshi):
    poly_title_raw = poly.get("title", "")
    kalshi_title_raw = kalshi.get("title", "")
    poly_title = normalize(poly_title_raw)
    kalshi_title = normalize(kalshi_title_raw)
    
    if poly_title == kalshi_title:
        return "yes"
        
    gemini_match = GEMINI_CACHE.get(gemini_cache_key(poly, kalshi))
    if gemini_match in ("yes", "no"):
        return gemini_match

    return "no"


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
    
    print("Gathering unique pairs for Gemini evaluation...")
    gemini_pairs_set = set()
    for bucket in payload:
        for match in bucket.get("matches", []):
            poly = match.get("polymarket", {})
            kalshi = match.get("kalshi", {})
            poly_title_raw = poly.get("title", "")
            kalshi_title_raw = kalshi.get("title", "")
            poly_title = normalize(poly_title_raw)
            kalshi_title = normalize(kalshi_title_raw)
            if poly_title != kalshi_title:
                gemini_pairs_set.add(gemini_cache_key(poly, kalshi))
                
    gemini_pairs = list(gemini_pairs_set)
    batch_size = 25
    total_batches = (len(gemini_pairs) + batch_size - 1) // batch_size
    
    print(f"Total unique pairs to check with Gemini: {len(gemini_pairs)} (in {total_batches} batches)")
    for i in range(0, len(gemini_pairs), batch_size):
        print(f"  Processing Gemini batch {i//batch_size + 1}/{total_batches}...")
        batch = gemini_pairs[i:i+batch_size]
        results = batch_check_with_gemini(batch)
        for (p, k), res in zip(batch, results):
            if res in ("yes", "no"):
                GEMINI_CACHE[(p, k)] = res
            else:
                GEMINI_CACHE[(p, k)] = "yes" if "yes" in res else "no"
                
    output = []
    total_buckets = len(payload)

    for i, bucket in enumerate(payload):
        print(f"Processing bucket {i+1}/{total_buckets}...")
        matches = bucket.get("matches", [])
        total_matches = len(matches)
        transformed_matches = []
        for j, match in enumerate(matches):
            if j % 100 == 0:
                print(f"  Processing match {j}/{total_matches} in bucket {i+1}...")
            transformed_matches.append(transform_match(match))
            
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
