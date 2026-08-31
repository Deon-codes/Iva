import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * POST /api/demo/scenario?user_id=xxx
 * Set the demo scenario for a user.
 */
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "demo-user";

  try {
    const body = await request.json();
    const result = await backendRequest(
      `/api/demo/scenario?user_id=${encodeURIComponent(userId)}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to set demo scenario" }, { status: 500 });
  }
}

/**
 * GET /api/demo/scenario?user_id=xxx
 * Get the current demo scenario.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "demo-user";

  try {
    const result = await backendRequest(
      `/api/demo/scenario?user_id=${encodeURIComponent(userId)}`
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get demo scenario" }, { status: 500 });
  }
}
