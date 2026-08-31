import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * GET /api/applications/events?application_id=xxx
 * Get the event timeline for an application.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get("application_id");

  if (!applicationId) {
    return NextResponse.json(
      { error: "application_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await backendRequest(
      `/api/applications/${encodeURIComponent(applicationId)}/events`
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
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
