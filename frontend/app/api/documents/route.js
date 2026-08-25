import { NextResponse } from "next/server";
import { mockDocuments, addDocument } from "../mockDb";

export async function GET() {
  return NextResponse.json(mockDocuments);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, issueDate, expiryDate } = body;
    
    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      type,
      status: "Valid",
      issueDate: issueDate || new Date().toISOString().split("T")[0],
      expiryDate: expiryDate || "Never",
      alert: "Uploaded by user.",
      applications: [],
      fileUrl: "#"
    };

    addDocument(newDoc);
    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid document payload" }, { status: 400 });
  }
}
