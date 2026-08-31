import { NextResponse } from "next/server";
import { backendRequest } from "../../lib/client";

/**
 * GET /api/verification/status
 * Returns a transparency report: what's real vs. mocked in the demo.
 */
export async function GET() {
  try {
    const result = await backendRequest("/api/verification/status");

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
