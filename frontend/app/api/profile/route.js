import { NextResponse } from "next/server";
import { mockProfile, updateProfile } from "../mockDb";

export async function GET() {
  return NextResponse.json(mockProfile);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const updated = updateProfile(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }
}
