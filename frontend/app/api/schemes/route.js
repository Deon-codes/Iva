import { NextResponse } from "next/server";
import { mockSchemes } from "../mockDb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (id) {
    const scheme = mockSchemes.find(s => s.id === id);
    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }
    return NextResponse.json(scheme);
  }
  
  return NextResponse.json(mockSchemes);
}
