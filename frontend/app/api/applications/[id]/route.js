import { NextResponse } from "next/server";
import { mockApplications, updateApplication } from "../../mockDb";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const app = mockApplications.find((a) => a.id === id);

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json(app);
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const existing = mockApplications.find((a) => a.id === id);

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    updateApplication(id, body);
    const updated = mockApplications.find((a) => a.id === id);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }
}
