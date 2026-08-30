import { NextResponse } from "next/server";
import { backendRequest } from "../lib/client";

/**
 * POST /api/chat
 *
 * Frontend sends: { message, user_id, session_id?, context? }
 * Backend expects: { user_id, message, session_id?, context? }
 * Backend returns: { session_id, response_text, actions, status_update, suggested_next_steps, prepared_application_id }
 * Response is passed through directly to AppContext.
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, user_id, session_id, context } = body;

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Forward to backend with the correct field names
    const result = await backendRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        user_id: user_id || "demo-user",
        message: message,
        session_id: session_id || null,
        context: context || {},
      }),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 502 });
    }

    // Pass through the backend response directly — AppContext reads
    // response_text, session_id, actions, suggested_next_steps, etc.
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
