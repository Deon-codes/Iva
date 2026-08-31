import { NextResponse } from "next/server";
import { backendRequest } from "../lib/client";

/**
 * Transform backend Document to frontend shape.
 * Backend: { id, user_id, document_type, filename, storage_url, status, extracted_fields, created_at }
 * Frontend: { id, type, status, issueDate, expiryDate, alert, applications, fileUrl }
 */
function transformDocument(doc) {
  const statusMap = {
    pending_verification: "Pending",
    verified: "Verified",
    rejected: "Rejected",
  };

  // Use backend-computed expiry if available
  const expiryDate = doc.expiry_date || "Never";
  const expiryStatus = doc.expiry_status || null;

  return {
    id: doc.id,
    type: doc.document_type || doc.filename || "Document",
    status: statusMap[doc.status] || doc.status || "Valid",
    issueDate: doc.created_at
      ? new Date(doc.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    expiryDate: expiryDate,
    expiryStatus: expiryStatus,
    alert: doc.extracted_fields?.alert || `Document registered: ${doc.filename || doc.document_type}`,
    applications: [],
    fileUrl: doc.storage_url || "#",
    verificationMetadata: doc.verification_metadata || {},
  };
}

/**
 * GET /api/documents?user_id=xxx
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "demo-user";

  try {
    const result = await backendRequest(
      `/api/documents?user_id=${encodeURIComponent(userId)}`
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const docs = Array.isArray(result.data)
      ? result.data.map(transformDocument)
      : [];
    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

/**
 * POST /api/documents
 * Register a new document metadata on the backend.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, expiryDate, userId } = body;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const result = await backendRequest("/api/documents", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId || "demo-user",
        document_type: type,
        filename: type,
        storage_url: "",
        extracted_fields: expiryDate ? { expiryDate } : {},
      }),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const doc = transformDocument(result.data);
    // If the backend didn't compute expiry (missing extracted_fields),
    // use the frontend-provided expiry date
    if (expiryDate && doc.expiryDate === "Never") {
      doc.expiryDate = expiryDate;
    }
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid document payload" }, { status: 400 });
  }
}

/**
 * DELETE /api/documents/[id]?user_id=xxx
 */

