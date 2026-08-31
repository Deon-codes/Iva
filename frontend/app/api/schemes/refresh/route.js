import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * POST /api/schemes/refresh
 * Triggers a full scheme refresh (curated + Data.gov.in).
 */
export async function POST() {
  try {
    const result = await backendRequest("/api/schemes/refresh", { method: "POST" });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 502 });
    }
    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json({ error: "Refresh failed. Showing previously loaded data." }, { status: 500 });
  }
}
