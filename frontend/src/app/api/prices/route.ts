import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Path to the python-src output file
    const pricesPath = path.join(
      process.cwd(),
      "..",
      "python-src",
      "prices",
      "live_prices.json"
    );

    const fileContents = await fs.readFile(pricesPath, "utf-8");
    const prices = JSON.parse(fileContents);

    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error reading live prices:", error);
    return NextResponse.json(
      { error: "Failed to read live prices" },
      { status: 500 }
    );
  }
}
