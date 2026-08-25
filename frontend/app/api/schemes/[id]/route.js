import { NextResponse } from "next/server";
import { mockSchemes } from "../../mockDb";

export async function GET(request, { params }) {
  // In Next.js 16, params is a Promise that must be awaited before accessing its properties.
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const scheme = mockSchemes.find(s => s.id === id);
  
  if (!scheme) {
    return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
  }
  
  return NextResponse.json(scheme);
}
