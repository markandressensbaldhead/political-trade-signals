import { NextResponse } from "next/server";

import { fetchQuiverTickerAltData } from "@/lib/quiver-alt-data";

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const data = await fetchQuiverTickerAltData(params.symbol);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load alt data";

    return NextResponse.json(
      {
        insiders: [],
        lobbying: [],
        contracts: [],
        configured: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
