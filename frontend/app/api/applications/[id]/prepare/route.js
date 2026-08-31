import { NextResponse } from "next/server";
import { backendRequest } from "../../../lib/client";

/**
 * POST /api/applications/{id}/prepare
 * Triggers application preparation on the backend:
 * maps user profile + documents to scheme form fields.
 */
export async function POST(request, { params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const result = await backendRequest(
      `/api/applications/${encodeURIComponent(id)}/prepare`,
      { method: "POST" }
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to prepare application" }, { status: 500 });
  }
}
