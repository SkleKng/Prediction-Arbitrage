import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// WS-detected arbitrage opportunities written by python-src/ws_price_monitoring.py.
// This endpoint surfaces the most recent ones so the UI can show a live
// "alerts" feed alongside the client-computed spread cards.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ARB_PATH = path.join(
  process.cwd(),
  "..",
  "python-src",
  "prices",
  "arb_opportunities.json"
);

const MAX_RETURNED = 100;

export async function GET() {
  try {
    const raw = await fs.readFile(ARB_PATH, "utf-8");
    const all = JSON.parse(raw);

    if (!Array.isArray(all)) {
      return NextResponse.json({ opportunities: [], total: 0 });
    }

    const slice = all.slice(-MAX_RETURNED).reverse(); // newest first
    return NextResponse.json({ opportunities: slice, total: all.length });
  } catch (error) {
    // Most common case: arb_opportunities.json doesn't exist yet (no arb
    // has been detected since the WS started). Treat as empty rather than
    // erroring so the UI stays clean.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ opportunities: [], total: 0 });
    }
    console.error("Error reading arb opportunities:", error);
    return NextResponse.json(
      { error: "Failed to read opportunities", opportunities: [], total: 0 },
      { status: 500 }
    );
  }
}
