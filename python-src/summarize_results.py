import json

with open('matches/ai_matches.json', 'r') as f:
    data = json.load(f)

matches = data[0]['matches']

same_market_count = sum(1 for m in matches if m['same_market'] == 'yes')
arb_count = sum(1 for m in matches if m['arbitrage_status'] == 'yes')
same_and_arb = sum(1 for m in matches if m['same_market'] == 'yes' and m['arbitrage_status'] == 'yes')

print(f"Total pairs evaluated: {len(matches)}")
print(f"Pairs deemed 'same market' by Gemini: {same_market_count}")
print(f"Pairs with arbitrage opportunities: {arb_count}")
print(f"Pairs that are BOTH same market AND have arbitrage: {same_and_arb}")

print("\n--- Top 5 Arbitrage Opportunities (Same Market) ---")
arb_matches = [m for m in matches if m['same_market'] == 'yes' and m['arbitrage_status'] == 'yes']

# Sort by largest gap
def get_max_gap(m):
    gaps = []
    if m['polymarket_yes_price'] is not None and m['kalshi_yes_ask'] is not None:
        gaps.append(abs(m['polymarket_yes_price'] - m['kalshi_yes_ask']))
    if m['polymarket_no_price'] is not None and m['kalshi_no_ask'] is not None:
        gaps.append(abs(m['polymarket_no_price'] - m['kalshi_no_ask']))
    return max(gaps) if gaps else 0

arb_matches.sort(key=get_max_gap, reverse=True)

for i, m in enumerate(arb_matches[:5]):
    print(f"\n{i+1}. Polymarket: {m['polymarket_title']}")
    print(f"   Kalshi: {m['kalshi_title']}")
    print(f"   Poly Yes: {m['polymarket_yes_price']} | Kalshi Yes Ask: {m['kalshi_yes_ask']}")
    print(f"   Poly No: {m['polymarket_no_price']} | Kalshi No Ask: {m['kalshi_no_ask']}")
    print(f"   Max Gap: {get_max_gap(m):.3f}")
