import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * POST /api/applications/mock-submit
 * Simulate government portal submission (demo only).
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
      `/api/applications/${encodeURIComponent(application_id)}/mock-submit`,
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
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
