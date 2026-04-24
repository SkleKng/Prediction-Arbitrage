import type {
  ArbitrageOpportunity,
  SystemStatus,
  PricePoint,
  MatchPair,
  LivePrices,
} from "@/types/market";

// Realistic mock data mirroring python-src/matches/embed_matches.json
export const MOCK_MATCHES: MatchPair[] = [
  {
    score: 0.9349,
    polymarket: {
      title: "Will DeepSeek have the best AI model at the end of April 2026?",
      id: "1664048",
      slug: "will-deepseek-have-the-best-ai-model-at-the-end-of-april-2026",
      description: "This market will resolve according to the company that owns the model that has the highest arena score based on the Chatbot Arena LLM Leaderboard.",
      end_date: "2026-04-30T00:00:00Z",
      category: "AI",
      liquidity: "21152.00947",
      fee: null,
      outcomePrices: '["0.0155", "0.9845"]',
      volumeNum: 263440.23,
      clob_token_ids: ["75824055835157359626200594584938997235067784984213259666893002279175265251466", "30075465254134656404187640443235161282116785974807420507152043117645610577746"],
    },
    kalshi: {
      title: "Will Deepseek have a top-ranked AI model before 2027?",
      ticker: "KXTOPAI-27-JAN01-DEPP",
      event_ticker: "KXTOPAI-27",
      subtitle: "",
      rules: "If Deepseek has a #1 ranked AI model before Jan 1, 2027, then the market resolves to Yes.",
      close_time: "2027-01-01T15:00:00Z",
      status: "active",
      volume_fp: "14010.00",
      rules_primary: "If Deepseek has a #1 ranked AI model before Jan 1, 2027, then the market resolves to Yes.",
      rules_secondary: "",
      yes_ask_dollars: "0.2400",
      no_ask_dollars: "0.8100",
    },
  },
  {
    score: 0.9209,
    polymarket: {
      title: "Will OpenAI have the best AI model at the end of April 2026?",
      id: "1664039",
      slug: "will-openai-have-the-best-ai-model-at-the-end-of-april-2026",
      description: "This market will resolve according to the company that owns the model that has the highest arena score based on the Chatbot Arena LLM Leaderboard.",
      end_date: "2026-04-30T00:00:00Z",
      category: "AI",
      liquidity: "13752.34493",
      fee: null,
      outcomePrices: '["0.0275", "0.9725"]',
      volumeNum: 169734.43,
      clob_token_ids: ["21742633143463906290569050155826241533067272736897614950488156847949938836455", "39821029281766301055801816390662480302102372466965862558613384498234820718660"],
    },
    kalshi: {
      title: "Will OpenAI have a top-ranked AI model before 2027?",
      ticker: "KXTOPAI-27-JAN01-OAIA",
      event_ticker: "KXTOPAI-27",
      subtitle: "",
      rules: "If OpenAI has a #1 ranked AI model before Jan 1, 2027, then the market resolves to Yes.",
      close_time: "2027-01-01T15:00:00Z",
      status: "active",
      volume_fp: "122340.00",
      rules_primary: "If OpenAI has a #1 ranked AI model before Jan 1, 2027, then the market resolves to Yes.",
      rules_secondary: "",
      yes_ask_dollars: "0.5500",
      no_ask_dollars: "0.5000",
    },
  },
  {
    score: 0.9148,
    polymarket: {
      title: "Will xAI have the best AI model at the end of April 2026?",
      id: "1664041",
      slug: "will-xai-have-the-best-ai-model-at-the-end-of-april-2026",
      description: "This market will resolve according to the company that owns the model that has the highest arena score based on the Chatbot Arena LLM Leaderboard.",
      end_date: "2026-04-30T00:00:00Z",
      category: "AI",
      liquidity: "20653.26524",
      fee: null,
      outcomePrices: '["0.0155", "0.9845"]',
      volumeNum: 45691.05,
      clob_token_ids: ["91047830764130458739823118113465178081464863610090710105983894422886925130707", "40329343445939559562066257833863304849825585157100407954917794856266414563160"],
    },
    kalshi: {
      title: "Will xAI have a top-ranked AI model before 2027?",
      ticker: "KXTOPAI-27-JAN01-XAI",
      event_ticker: "KXTOPAI-27",
      subtitle: "",
      rules: "If xAI has a #1 ranked AI model before Jan 1, 2027, then the market resolves to Yes.",
      close_time: "2027-01-01T15:00:00Z",
      status: "active",
      volume_fp: "41560.00",
      rules_primary: "If xAI has a #1 ranked AI model before Jan 1, 2027, then the market resolves to Yes.",
      rules_secondary: "",
      yes_ask_dollars: "0.3700",
      no_ask_dollars: "0.6600",
    },
  },
  {
    score: 0.9612,
    polymarket: {
      title: "Will the Fed cut interest rates in June 2026?",
      id: "1580012",
      slug: "will-the-fed-cut-interest-rates-in-june-2026",
      description: "This market resolves to Yes if the Federal Reserve cuts the federal funds rate at its June 2026 FOMC meeting.",
      end_date: "2026-06-18T00:00:00Z",
      category: "Economics",
      liquidity: "89234.12",
      fee: null,
      outcomePrices: '["0.6200", "0.3800"]',
      volumeNum: 1245890.50,
      clob_token_ids: ["11234567890123456789012345678901234567890123456789012345678901234567890123456", "22345678901234567890123456789012345678901234567890123456789012345678901234567"],
    },
    kalshi: {
      title: "Fed rate cut in June 2026?",
      ticker: "KXFEDRATE-26JUN-CUT25",
      event_ticker: "KXFEDRATE-26JUN",
      subtitle: "",
      rules: "Resolves to Yes if the FOMC reduces the fed funds rate target at its June 2026 meeting.",
      close_time: "2026-06-18T20:00:00Z",
      status: "active",
      volume_fp: "2341200.00",
      rules_primary: "Resolves to Yes if the FOMC reduces the fed funds rate target at its June 2026 meeting.",
      rules_secondary: "",
      yes_ask_dollars: "0.5800",
      no_ask_dollars: "0.4400",
    },
  },
  {
    score: 0.9501,
    polymarket: {
      title: "Will Bitcoin reach $150,000 before July 2026?",
      id: "1712005",
      slug: "will-bitcoin-reach-150000-before-july-2026",
      description: "This market resolves to Yes if Bitcoin's price reaches or exceeds $150,000 USD before July 1, 2026.",
      end_date: "2026-07-01T00:00:00Z",
      category: "Crypto",
      liquidity: "156780.45",
      fee: null,
      outcomePrices: '["0.2800", "0.7200"]',
      volumeNum: 3421560.80,
      clob_token_ids: ["33456789012345678901234567890123456789012345678901234567890123456789012345678", "44567890123456789012345678901234567890123456789012345678901234567890123456789"],
    },
    kalshi: {
      title: "Bitcoin above $150K before July 2026?",
      ticker: "KXBTC-26JUL-150K",
      event_ticker: "KXBTC-26JUL",
      subtitle: "",
      rules: "Resolves to Yes if Bitcoin reaches $150,000 before July 1, 2026.",
      close_time: "2026-07-01T00:00:00Z",
      status: "active",
      volume_fp: "1890340.00",
      rules_primary: "Resolves to Yes if Bitcoin reaches $150,000 before July 1, 2026.",
      rules_secondary: "",
      yes_ask_dollars: "0.2400",
      no_ask_dollars: "0.7800",
    },
  },
  {
    score: 0.9823,
    polymarket: {
      title: "Will there be a US recession in 2026?",
      id: "1398442",
      slug: "will-there-be-a-us-recession-in-2026",
      description: "This market resolves to Yes if the NBER declares a recession starting in 2026.",
      end_date: "2027-01-01T00:00:00Z",
      category: "Economics",
      liquidity: "234567.89",
      fee: null,
      outcomePrices: '["0.3500", "0.6500"]',
      volumeNum: 5678900.12,
      clob_token_ids: ["55678901234567890123456789012345678901234567890123456789012345678901234567890", "66789012345678901234567890123456789012345678901234567890123456789012345678901"],
    },
    kalshi: {
      title: "US recession in 2026 (NBER)?",
      ticker: "KXRECSSNBER-26",
      event_ticker: "KXRECSSNBER",
      subtitle: "",
      rules: "Resolves to Yes if NBER declares a US recession beginning in 2026.",
      close_time: "2027-03-01T00:00:00Z",
      status: "active",
      volume_fp: "3456780.00",
      rules_primary: "Resolves to Yes if NBER declares a US recession beginning in 2026.",
      rules_secondary: "",
      yes_ask_dollars: "0.3600",
      no_ask_dollars: "0.6700",
    },
  },
  {
    score: 0.9134,
    polymarket: {
      title: "Will Kimi Antonelli be the 2026 F1 Drivers' Champion?",
      id: "1455210",
      slug: "will-kimi-antonelli-be-the-2026-f1-drivers-champion",
      description: "This market resolves to Yes if Kimi Antonelli wins the 2026 FIA Formula One World Drivers' Championship.",
      end_date: "2026-12-07T00:00:00Z",
      category: "Sports",
      liquidity: "45230.67",
      fee: null,
      outcomePrices: '["0.3360", "0.6640"]',
      volumeNum: 890123.45,
      clob_token_ids: ["77890123456789012345678901234567890123456789012345678901234567890123456789012", "88901234567890123456789012345678901234567890123456789012345678901234567890123"],
    },
    kalshi: {
      title: "Kimi Antonelli F1 champion 2026?",
      ticker: "KXF1CHAMP-26-ANTO",
      event_ticker: "KXF1CHAMP-26",
      subtitle: "",
      rules: "Resolves to Yes if Kimi Antonelli wins the 2026 F1 Drivers' World Championship.",
      close_time: "2026-12-15T00:00:00Z",
      status: "active",
      volume_fp: "567890.00",
      rules_primary: "Resolves to Yes if Kimi Antonelli wins the 2026 F1 Drivers' World Championship.",
      rules_secondary: "",
      yes_ask_dollars: "0.2900",
      no_ask_dollars: "0.7300",
    },
  },
  {
    score: 0.9445,
    polymarket: {
      title: "Will Apple release AR glasses in 2026?",
      id: "1523890",
      slug: "will-apple-release-ar-glasses-in-2026",
      description: "Resolves to Yes if Apple releases augmented reality glasses to consumers in 2026.",
      end_date: "2027-01-01T00:00:00Z",
      category: "Tech",
      liquidity: "67890.12",
      fee: null,
      outcomePrices: '["0.1200", "0.8800"]',
      volumeNum: 1234567.89,
      clob_token_ids: ["99012345678901234567890123456789012345678901234567890123456789012345678901234", "10123456789012345678901234567890123456789012345678901234567890123456789012345"],
    },
    kalshi: {
      title: "Apple AR glasses release in 2026?",
      ticker: "KXAPPLE-26-ARGLASS",
      event_ticker: "KXAPPLE-26",
      subtitle: "",
      rules: "Resolves to Yes if Apple releases AR glasses (not VR headset) in 2026.",
      close_time: "2027-01-01T00:00:00Z",
      status: "active",
      volume_fp: "890120.00",
      rules_primary: "Resolves to Yes if Apple releases AR glasses (not VR headset) in 2026.",
      rules_secondary: "",
      yes_ask_dollars: "0.0800",
      no_ask_dollars: "0.9400",
    },
  },
  {
    score: 0.9567,
    polymarket: {
      title: "Will US GDP growth exceed 3% in Q2 2026?",
      id: "1634521",
      slug: "will-us-gdp-growth-exceed-3-percent-in-q2-2026",
      description: "Resolves to Yes if the Bureau of Economic Analysis reports real GDP growth exceeding 3% annualized for Q2 2026.",
      end_date: "2026-08-30T00:00:00Z",
      category: "Economics",
      liquidity: "34567.89",
      fee: null,
      outcomePrices: '["0.1800", "0.8200"]',
      volumeNum: 678901.23,
      clob_token_ids: ["12234567890123456789012345678901234567890123456789012345678901234567890123456", "13345678901234567890123456789012345678901234567890123456789012345678901234567"],
    },
    kalshi: {
      title: "US GDP growth above 3% Q2 2026?",
      ticker: "KXGDP-26Q2-3PCT",
      event_ticker: "KXGDP-26Q2",
      subtitle: "",
      rules: "Resolves to Yes if BEA reports >3% annualized real GDP growth for Q2 2026.",
      close_time: "2026-09-01T00:00:00Z",
      status: "active",
      volume_fp: "456780.00",
      rules_primary: "Resolves to Yes if BEA reports >3% annualized real GDP growth for Q2 2026.",
      rules_secondary: "",
      yes_ask_dollars: "0.1500",
      no_ask_dollars: "0.8700",
    },
  },
  {
    score: 0.9289,
    polymarket: {
      title: "Will the S&P 500 close above 6,500 on June 30, 2026?",
      id: "1689034",
      slug: "will-the-sp-500-close-above-6500-on-june-30-2026",
      description: "Resolves to Yes if S&P 500 closing price is above 6,500 on June 30, 2026.",
      end_date: "2026-06-30T00:00:00Z",
      category: "Finance",
      liquidity: "123456.78",
      fee: null,
      outcomePrices: '["0.4500", "0.5500"]',
      volumeNum: 2345678.90,
      clob_token_ids: ["14456789012345678901234567890123456789012345678901234567890123456789012345678", "15567890123456789012345678901234567890123456789012345678901234567890123456789"],
    },
    kalshi: {
      title: "S&P 500 above 6,500 end of June 2026?",
      ticker: "KXSP500-26JUN-6500",
      event_ticker: "KXSP500-26JUN",
      subtitle: "",
      rules: "Resolves to Yes if S&P 500 closes above 6,500 on June 30, 2026.",
      close_time: "2026-07-01T00:00:00Z",
      status: "active",
      volume_fp: "1567890.00",
      rules_primary: "Resolves to Yes if S&P 500 closes above 6,500 on June 30, 2026.",
      rules_secondary: "",
      yes_ask_dollars: "0.4200",
      no_ask_dollars: "0.6000",
    },
  },
];

// Mirrors python-src/prices/live_prices.json
export const MOCK_LIVE_PRICES: LivePrices = {
  "poly::Will DeepSeek have the best AI model at the end of April 2026?": {
    yes_ask: 0.018,
    no_ask: 0.983,
    timestamp: "1774757649216",
  },
  "kalshi::KXTOPAI-27-JAN01-DEPP": {
    yes_ask: 0.24,
    no_ask: 0.81,
    timestamp: "2026-03-29T04:13:51Z",
  },
  "poly::Will OpenAI have the best AI model at the end of April 2026?": {
    yes_ask: 0.028,
    no_ask: 0.973,
    timestamp: "1774757649300",
  },
  "kalshi::KXTOPAI-27-JAN01-OAIA": {
    yes_ask: 0.55,
    no_ask: 0.50,
    timestamp: "2026-03-29T04:13:52Z",
  },
  "poly::Will xAI have the best AI model at the end of April 2026?": {
    yes_ask: 0.016,
    no_ask: 0.985,
    timestamp: "1774757649400",
  },
  "kalshi::KXTOPAI-27-JAN01-XAI": {
    yes_ask: 0.37,
    no_ask: 0.66,
    timestamp: "2026-03-29T04:13:53Z",
  },
  "poly::Will the Fed cut interest rates in June 2026?": {
    yes_ask: 0.62,
    no_ask: 0.38,
    timestamp: "1774757650100",
  },
  "kalshi::KXFEDRATE-26JUN-CUT25": {
    yes_ask: 0.58,
    no_ask: 0.44,
    timestamp: "2026-03-29T04:14:01Z",
  },
  "poly::Will Bitcoin reach $150,000 before July 2026?": {
    yes_ask: 0.28,
    no_ask: 0.72,
    timestamp: "1774757650200",
  },
  "kalshi::KXBTC-26JUL-150K": {
    yes_ask: 0.24,
    no_ask: 0.78,
    timestamp: "2026-03-29T04:14:02Z",
  },
  "poly::Will there be a US recession in 2026?": {
    yes_ask: 0.35,
    no_ask: 0.65,
    timestamp: "1774757650300",
  },
  "kalshi::KXRECSSNBER-26": {
    yes_ask: 0.36,
    no_ask: 0.67,
    timestamp: "2026-03-29T04:13:52Z",
  },
  "poly::Will Kimi Antonelli be the 2026 F1 Drivers' Champion?": {
    yes_ask: 0.336,
    no_ask: 0.677,
    timestamp: "1774757635310",
  },
  "kalshi::KXF1CHAMP-26-ANTO": {
    yes_ask: 0.29,
    no_ask: 0.73,
    timestamp: "2026-03-29T04:14:05Z",
  },
  "poly::Will Apple release AR glasses in 2026?": {
    yes_ask: 0.12,
    no_ask: 0.88,
    timestamp: "1774757650500",
  },
  "kalshi::KXAPPLE-26-ARGLASS": {
    yes_ask: 0.08,
    no_ask: 0.94,
    timestamp: "2026-03-29T04:14:06Z",
  },
  "poly::Will US GDP growth exceed 3% in Q2 2026?": {
    yes_ask: 0.18,
    no_ask: 0.82,
    timestamp: "1774757650600",
  },
  "kalshi::KXGDP-26Q2-3PCT": {
    yes_ask: 0.15,
    no_ask: 0.87,
    timestamp: "2026-03-29T04:14:07Z",
  },
  "poly::Will the S&P 500 close above 6,500 on June 30, 2026?": {
    yes_ask: 0.45,
    no_ask: 0.55,
    timestamp: "1774757650700",
  },
  "kalshi::KXSP500-26JUN-6500": {
    yes_ask: 0.42,
    no_ask: 0.60,
    timestamp: "2026-03-29T04:14:08Z",
  },
};

// Computed arbitrage opportunities from match + price data
export function computeArbitrageOpportunities(customPrices?: LivePrices): ArbitrageOpportunity[] {
  const pricesToUse = customPrices || MOCK_LIVE_PRICES;
  
  return MOCK_MATCHES.map((match, idx) => {
    const polyKey = `poly::${match.polymarket.title}`;
    const kalshiKey = `kalshi::${match.kalshi.ticker}`;
    const polyPrice = pricesToUse[polyKey] || null;
    const kalshiPrice = pricesToUse[kalshiKey] || null;

    const polyYesAsk = polyPrice?.yes_ask ?? 0;
    const polyNoAsk = polyPrice?.no_ask ?? 0;
    const kalshiYesAsk = kalshiPrice?.yes_ask ?? 0;
    const kalshiNoAsk = kalshiPrice?.no_ask ?? 0;

    // Arbitrage calculation based on MARKET ORDERS (crossing the spread)
    // To hedge, we must buy YES on one exchange and buy NO on the other exchange at the ASK price.
    
    // Scenario A: Buy YES on Polymarket, Buy NO on Kalshi
    const costA = (polyYesAsk > 0 && kalshiNoAsk > 0) ? (polyYesAsk + kalshiNoAsk) : Infinity;
    
    // Scenario B: Buy YES on Kalshi, Buy NO on Polymarket
    const costB = (kalshiYesAsk > 0 && polyNoAsk > 0) ? (kalshiYesAsk + polyNoAsk) : Infinity;

    const profitA = costA !== Infinity ? (1 - costA) * 100 : -Infinity;
    const profitB = costB !== Infinity ? (1 - costB) * 100 : -Infinity;

    let spread = 0;
    let direction: ArbitrageOpportunity["direction"] = "none";
    
    if (profitA > profitB && profitA !== -Infinity) {
      spread = profitA;
      direction = "poly_yes_kalshi_no";
    } else if (profitB > profitA && profitB !== -Infinity) {
      spread = profitB;
      direction = "kalshi_yes_poly_no";
    } else if (profitA === profitB && profitA !== -Infinity) {
      spread = profitA;
      direction = "poly_yes_kalshi_no";
    } else {
      spread = 0; // No valid market orders available
      direction = "none";
    }

    return {
      id: `arb-${idx}-${match.polymarket.id}`,
      matchScore: match.score,
      polymarket: match.polymarket,
      kalshi: match.kalshi,
      polyPrice,
      kalshiPrice,
      spread,
      direction,
      profit: spread / 100,
      lastUpdated: polyPrice?.timestamp || new Date().toISOString(),
    };
  }).sort((a, b) => b.spread - a.spread);
}

// Generate mock historical price points for chart
export function generatePriceHistory(
  polyStart: number,
  kalshiStart: number,
  points: number = 48
): PricePoint[] {
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points; // 24h spread
  const history: PricePoint[] = [];

  let polyPrice = polyStart;
  let kalshiPrice = kalshiStart;

  for (let i = 0; i < points; i++) {
    const drift = (Math.random() - 0.5) * 0.04;
    const convergence = (kalshiPrice - polyPrice) * 0.02;

    polyPrice = Math.max(0.01, Math.min(0.99, polyPrice + drift + convergence * 0.5));
    kalshiPrice = Math.max(0.01, Math.min(0.99, kalshiPrice + drift - convergence * 0.3));

    history.push({
      timestamp: now - (points - i) * interval,
      polyYes: parseFloat(polyPrice.toFixed(4)),
      kalshiYes: parseFloat(kalshiPrice.toFixed(4)),
      spread: parseFloat(((kalshiPrice - polyPrice) * 100).toFixed(2)),
    });
  }

  return history;
}

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  vpsUptime: "online",
  kalshiSocket: "connected",
  polySocket: "connected",
  aiEngine: "active",
};

export const MOCK_TOTAL_CAPITAL = 125430;
export const MOCK_24HR_PNL = 3847.52;
export const MOCK_ACTIVE_POSITIONS = 14;
export const MOCK_TOTAL_MATCHES = 676;
