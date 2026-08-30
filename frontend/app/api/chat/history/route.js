import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * GET /api/chat/history?user_id=xxx
 * Lists all conversation sessions for a user from the backend.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const result = await backendRequest(
      `/api/chat/history?user_id=${encodeURIComponent(userId)}`
    );

    if (result.error) {
      // Return empty array on error so the UI doesn't break
      return NextResponse.json([]);
    }

    return NextResponse.json(result.data || []);
  } catch (err) {
    return NextResponse.json([]);
  }
}
