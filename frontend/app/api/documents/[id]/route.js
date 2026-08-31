import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * DELETE /api/documents/[id]?user_id=xxx
 * Delete a document by ID with ownership verification.
 */
export async function DELETE(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "demo-user";

  if (!id) {
    return NextResponse.json({ error: "Document ID required" }, { status: 400 });
  }

  try {
    const result = await backendRequest(
      `/api/documents/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
