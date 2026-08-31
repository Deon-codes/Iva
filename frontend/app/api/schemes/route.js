import { NextResponse } from "next/server";
import { backendRequest, transformSchemeListItem, transformSchemeDetail } from "../lib/client";

/**
 * GET /api/schemes?id=xxx
 * Proxies to backend GET /api/schemes or GET /api/schemes/{id}
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Fetch full scheme details from backend
      const result = await backendRequest(`/api/schemes/${encodeURIComponent(id)}`);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(transformSchemeDetail(result.data));
    }

    // Fetch schemes — default to curated (actionable) schemes for the Explore page.
    // Pass user_id for personalized ranking if available, source_type for filtering.
    const userId = searchParams.get("user_id");
    const sourceType = searchParams.get("source_type") || "curated";
    const params = new URLSearchParams();
    if (userId) params.set("user_id", userId);
    if (sourceType) params.set("source_type", sourceType);
    const url = `/api/schemes${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await backendRequest(url);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const schemes = Array.isArray(result.data)
      ? result.data.map(transformSchemeListItem)
      : [];
    return NextResponse.json(schemes);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch schemes" }, { status: 500 });
  }
}
