import { NextResponse } from "next/server";
import { backendRequest, transformApplication } from "../lib/client";

/**
 * GET /api/applications?id=xxx&user_id=xxx
 * Proxies to backend GET /api/applications?user_id=xxx or GET /api/applications/{id}
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("user_id") || "demo-user";

  try {
    if (id) {
      // Fetch a specific application
      const result = await backendRequest(`/api/applications/${encodeURIComponent(id)}`);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(transformApplication(result.data));
    }

    // Fetch all applications for user
    const result = await backendRequest(
      `/api/applications?user_id=${encodeURIComponent(userId)}`
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const apps = Array.isArray(result.data)
      ? result.data.map(transformApplication)
      : [];
    return NextResponse.json(apps);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

/**
 * POST /api/applications
 * Create a new application on the backend.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const schemeId = body.schemeId || body.scheme_id;
    const userId = body.userId || body.user_id;
    const name = body.name;

    if (!schemeId) {
      return NextResponse.json({ error: "scheme_id is required" }, { status: 400 });
    }

    const result = await backendRequest("/api/applications", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId || "demo-user",
        scheme_id: schemeId,
      }),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const app = transformApplication(result.data);
    // Attach the scheme name if provided
    if (name) app.name = name;
    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid application payload" }, { status: 400 });
  }
}
