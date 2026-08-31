import { NextResponse } from "next/server";
import { backendRequest } from "../lib/client";

/**
 * Map frontend onboarding fields to backend UserProfileCreate fields.
 */
function toBackendProfile(body) {
  // Parse income range string to numeric value
  let annualIncome = undefined;
  const incomeMap = {
    "Below ₹1,50,000": 100000,
    "₹1,50,000 - ₹2,50,000": 200000,
    "₹2,50,000 - ₹4,50,000": 350000,
    "Above ₹4,50,000": 500000,
  };
  if (body.incomeRange && incomeMap[body.incomeRange]) {
    annualIncome = incomeMap[body.incomeRange];
  }

  return {
    user_id: body.user_id || body.uid || body.id,
    name: body.name || "",
    email: body.email || "",
    state: body.state || undefined,
    age: body.age ? parseInt(body.age, 10) || undefined : undefined,
    annual_income_inr: annualIncome,
    education_level: body.education || undefined,
    caste_category: body.category || undefined,
    gender: body.gender || undefined,
    disability: body.disability || false,
    institution_name: body.institution_name || undefined,
    course_name: body.course_name || undefined,
  };
}

/**
 * Map backend UserProfile fields to frontend shape.
 */
function toFrontendProfile(data) {
  return {
    uid: data.id,
    name: data.name || "",
    email: data.email || "",
    state: data.state || "",
    education: data.education_level || "",
    category: data.caste_category || "",
    incomeRange: data.annual_income_inr ? `₹${(data.annual_income_inr / 100000).toFixed(1)} Lakh` : "",
    phone: data.phone || "",
    age: data.age ? String(data.age) : "",
    gender: data.gender || "",
    preferences: "",
  };
}

/**
 * GET /api/profile?user_id=xxx
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id query parameter is required" }, { status: 400 });
  }

  try {
    const result = await backendRequest(`/api/profile?user_id=${encodeURIComponent(userId)}`);
    if (result.error) {
      if (result.status === 404) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(toFrontendProfile(result.data));
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

/**
 * POST /api/profile
 * Creates or updates user profile on the backend.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const backendBody = toBackendProfile(body);

    if (!backendBody.user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const result = await backendRequest("/api/profile", {
      method: "POST",
      body: JSON.stringify(backendBody),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(toFrontendProfile(result.data));
  } catch (error) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }
}

/**
 * PUT /api/profile — update an existing user profile.
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const backendBody = toBackendProfile(body);

    if (!backendBody.user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const result = await backendRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(backendBody),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(toFrontendProfile(result.data));
  } catch (error) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }
}
