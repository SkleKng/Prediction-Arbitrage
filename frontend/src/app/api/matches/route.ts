import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { MatchPair } from "@/types/market";

// Disable caching so the dashboard reflects regenerated AI matches without
// requiring a server restart.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AiMatchEntry {
  same_market: string;
  resolved_status: string;
  polymarket_id: string;
  kalshi_ticker: string;
  arbitrage_status?: string;
}

interface AiMatchBucket {
  threshold: number;
  count: number;
  matches: AiMatchEntry[];
}

interface EmbedMatchBucket {
  threshold: number;
  count: number;
  matches: MatchPair[];
}

const PYTHON_SRC = path.join(process.cwd(), "..", "python-src");
const AI_MATCHES_PATH = path.join(PYTHON_SRC, "matches", "ai_matches.json");
const EMBED_MATCHES_PATH = path.join(PYTHON_SRC, "matches", "embed_matches.json");

export async function GET() {
  try {
    const [aiRaw, embedRaw] = await Promise.all([
      fs.readFile(AI_MATCHES_PATH, "utf-8"),
      fs.readFile(EMBED_MATCHES_PATH, "utf-8"),
    ]);

    const aiBuckets = JSON.parse(aiRaw) as AiMatchBucket[];
    const embedBuckets = JSON.parse(embedRaw) as EmbedMatchBucket[];

    // Build a set of (poly_id::kalshi_ticker) keys that AI confirmed are
    // the same market AND not already resolved.
    const confirmedKeys = new Set<string>();
    for (const bucket of aiBuckets) {
      for (const m of bucket.matches) {
        if (m.same_market === "yes" && m.resolved_status === "no") {
          confirmedKeys.add(`${m.polymarket_id}::${m.kalshi_ticker}`);
        }
      }
    }

    const totalAiPairs = aiBuckets.reduce((sum, b) => sum + b.count, 0);

    // Filter the rich embed_matches data down to only AI-confirmed pairs
    // (deduplicated across threshold buckets, keeping the highest score).
    const seen = new Map<string, MatchPair>();
    for (const bucket of embedBuckets) {
      for (const match of bucket.matches) {
        const key = `${match.polymarket.id}::${match.kalshi.ticker}`;
        if (!confirmedKeys.has(key)) continue;
        const existing = seen.get(key);
        if (!existing || match.score > existing.score) {
          seen.set(key, match);
        }
      }
    }

    const matches = Array.from(seen.values()).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      matches,
      confirmedCount: confirmedKeys.size,
      totalAiPairs,
    });
  } catch (error) {
    console.error("Error reading matches:", error);
    return NextResponse.json(
      { error: "Failed to read matches", matches: [], confirmedCount: 0, totalAiPairs: 0 },
      { status: 500 }
    );
  }
}
