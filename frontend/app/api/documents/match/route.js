import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * POST /api/documents/match
 * Match user documents against scheme requirements.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, required, deadline } = body;

    if (!user_id || !required) {
      return NextResponse.json(
        { error: "user_id and required are required" },
        { status: 400 }
      );
    }

    const result = await backendRequest("/api/documents/match", {
      method: "POST",
      body: JSON.stringify({ user_id, required, deadline }),
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to match documents" },
      { status: 500 }
    );
  }
}
