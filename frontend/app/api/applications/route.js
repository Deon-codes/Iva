import { NextResponse } from "next/server";
import { mockApplications, addApplication, updateApplication } from "../mockDb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (id) {
    const app = mockApplications.find(a => a.id === id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    return NextResponse.json(app);
  }
  
  return NextResponse.json(mockApplications);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { schemeId, name } = body;
    
    if (!schemeId || !name) {
      return NextResponse.json({ error: "schemeId and name are required" }, { status: 400 });
    }

    // Check if it already exists
    const existing = mockApplications.find(a => a.schemeId === schemeId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const newApp = {
      id: `app-${schemeId}`,
      schemeId,
      name,
      status: "Preparing Application",
      reason: "Initializing verification steps: profile loading, documents verification.",
      updatedAt: "Just now",
      workflow: {
        profile: "completed",
        eligibility: "in_progress",
        documents: "pending",
        application: "pending",
        review: "pending",
        otp: "locked"
      },
      history: [
        { event: "Application initiated by agent", status: "success", timestamp: "Just now" },
        { event: "Profile verified", status: "success", timestamp: "Just now" }
      ]
    };

    addApplication(newApp);
    return NextResponse.json(newApp, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid application payload" }, { status: 400 });
  }
}
