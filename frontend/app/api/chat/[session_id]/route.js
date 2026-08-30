import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * GET /api/chat/[session_id]
 * Retrieve a full conversation by session ID from the backend.
 */
export async function GET(request, { params }) {
  const { session_id } = params;

  if (!session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  try {
    const result = await backendRequest(
      `/api/chat/${encodeURIComponent(session_id)}`
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
