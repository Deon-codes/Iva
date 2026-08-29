import { NextResponse } from "next/server";
import { backendRequest } from "../lib/client";

/**
 * POST /api/chat
 *
 * Frontend sends: { message, schemeContext?, applicationContext? }
 * Backend expects: { user_id, message, session_id?, context? }
 * Backend returns: { session_id, response_text, actions, status_update, suggested_next_steps, prepared_application_id }
 * Frontend expects: { reply, agentState, chatMessage, updatedApplications?, updatedProfile? }
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, schemeContext, applicationContext, userId, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Build context from scheme/application context if provided
    const context = {};
    if (schemeContext) context.scheme = schemeContext;
    if (applicationContext) context.application = applicationContext;

    // Forward to backend
    const result = await backendRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId || "demo-user",
        message: message,
        session_id: sessionId || null,
        context: context,
      }),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 502 });
    }

    const data = result.data;

    // Determine agent state from backend response
    let agentState = "Attentive";
    if (data.status_update === "action_required") {
      agentState = "Confused";
    }
    if (data.actions && data.actions.length > 0) {
      const toolNames = data.actions.map((a) => a.tool_name || "");
      if (toolNames.some((t) => t.includes("legitimacy") || t.includes("verify"))) {
        agentState = "Suspicious";
      }
      if (data.actions.length > 1) {
        agentState = "Excited";
      }
    }
    if (data.suggested_next_steps && data.suggested_next_steps.length > 0) {
      agentState = "Excited";
    }

    // Build work cards from suggested steps
    const workCards = (data.suggested_next_steps || []).map((step, i) => ({
      id: `card-step-${i}`,
      title: step.split(" ")[0]?.toUpperCase() || "AGENT",
      description: step,
      timestamp: "Just now",
      status: "success",
    }));

    // Add prepared application card if present
    if (data.prepared_application_id) {
      workCards.push({
        id: "card-app-prepared",
        title: "APPLICATION PREPARED",
        description: `Application ${data.prepared_application_id} is ready for review.`,
        timestamp: "Just now",
        status: "success",
      });
    }

    // Build the agent chat message in the frontend shape
    const chatMessage = {
      id: `msg-agent-${Date.now()}`,
      sender: "agent",
      text: data.response_text || "I've processed your request.",
      timestamp: "Just now",
      agentState,
      workCards: workCards.length > 0 ? workCards : undefined,
    };

    return NextResponse.json({
      reply: data.response_text,
      agentState,
      chatMessage,
      sessionId: data.session_id,
      actions: data.actions || [],
      preparedApplicationId: data.prepared_application_id,
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
