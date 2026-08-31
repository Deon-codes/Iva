import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * POST /api/applications/status-check
 * Check application status against mock government portal.
 * Body: { application_id }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { application_id } = body;

    if (!application_id) {
      return NextResponse.json(
        { error: "application_id is required" },
        { status: 400 }
      );
    }

    const result = await backendRequest(
      `/api/applications/${encodeURIComponent(application_id)}/status-check`,
      { method: "POST", body: JSON.stringify({}) }
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
