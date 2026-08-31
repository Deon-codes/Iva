import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * GET /api/schemes/meta
 * Returns ingestion metadata (last updated, counts).
 */
export async function GET() {
  try {
    const result = await backendRequest("/api/schemes/meta");
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 502 });
    }
    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch scheme metadata" }, { status: 500 });
  }
}
