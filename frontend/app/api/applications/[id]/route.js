import { NextResponse } from "next/server";
import { mockApplications } from "../../mockDb";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const app = mockApplications.find(a => a.id === id);
  
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  
  return NextResponse.json(app);
}
