import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * GET /api/applications/{id}
 * Proxies to backend GET /api/applications/{id}
 */
export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const result = await backendRequest(`/api/applications/${encodeURIComponent(id)}`);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

/**
 * PATCH /api/applications/{id}
 * Proxies to backend PATCH /api/applications/{id}
 */
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Map frontend field names to backend field names
    const backendBody = {};
    if (body.status) {
      // Map display status back to backend status
      const statusMap = {
        "Preparing Application": "draft",
        "Action Required": "action_required",
        "Submitted to Department": "submitted",
        "Under Review": "under_review",
        "Approved": "approved",
        "Approved & Disbursed": "approved",
        "Rejected": "rejected",
      };
      backendBody.status = statusMap[body.status] || body.status;
    }
    if (body.reason) backendBody.next_action = body.reason;
    if (body.form_data) backendBody.form_data = body.form_data;
    if (body.workflow) backendBody.form_data = { ...body.form_data, workflow: body.workflow };

    const result = await backendRequest(`/api/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(backendBody),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }
}
