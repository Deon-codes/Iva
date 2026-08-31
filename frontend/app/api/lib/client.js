/**
 * API Client for forwarding Next.js API route requests to the FastAPI backend.
 *
 * The backend runs on port 8000 (configurable via BACKEND_URL env var).
 * Next.js API routes act as a proxy, transforming request/response shapes
 * between the frontend contract and the backend contract.
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Make a request to the backend API.
 * @param {string} path - Backend API path (e.g. "/api/chat")
 * @param {object} options - fetch options (method, body, headers)
 * @returns {Promise<{data: any, status: number} | {error: string, status: number}>}
 */
export async function backendRequest(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: text || `Backend returned ${res.status}`, status: res.status };
    }

    // Handle 204 No Content (e.g. DELETE)
    if (res.status === 204) {
      return { data: null, status: 204 };
    }

    const data = await res.json();
    return { data, status: res.status };
  } catch (err) {
    return { error: `Backend unavailable: ${err.message}`, status: 502 };
  }
}

// ─── Scheme transformations ─────────────────────────────────────────────────

/**
 * Transform a backend scheme list item into the shape the frontend Explore page expects.
 * Backend list returns: { id, name, department, category, is_central, state, benefits_summary, official_url, eligibility_summary }
 * Frontend expects: { id, name, department, benefit, eligibility, deadline, requiredDocuments, legitimacyStatus, officialSource, whyRelevant, recommendedAction }
 */
export function transformSchemeListItem(s) {
  const base = {
    id: s.id,
    name: s.name,
    department: s.department,
    benefit: s.benefits_summary || "",
    eligibility: s.eligibility_summary || "",
    deadline: "2026-12-31",
    requiredDocuments: [],
    legitimacyStatus: s.verification_status === "verified" ? "Verified (Government Portal)"
      : s.verification_status === "partially_verified" ? "Partially Verified"
      : s.verification_status === "unverified_url" ? "Source Needs Review"
      : "Source Not Verified",
    officialSource: s.official_url || "#",
    whyRelevant: "",
    recommendedAction: "",
  };

  // Pass through personalized match data if the backend returned it
  if (s.match_score !== undefined) {
    base.match_score = s.match_score;
    base.eligibility_status = s.eligibility_status;
    base.matched_rules = s.matched_rules || [];
    base.failed_rules = s.failed_rules || [];
    base.missing_information = s.missing_information || [];
    base.match_reasons = s.match_reasons || [];
  }

  return base;
}

/**
 * Transform a full backend scheme detail into the frontend shape.
 * Backend detail: { id, name, department, description, eligibility: {...}, benefits, required_documents, deadline, official_url, ... }
 */
export function transformSchemeDetail(s) {
  return {
    id: s.id,
    name: s.name,
    department: s.department,
    benefit: s.benefits || "",
    eligibility: s.eligibility?.description || "",
    deadline: s.deadline || "2026-12-31",
    requiredDocuments: s.required_documents || [],
    legitimacyStatus: s.verification_status === "verified" ? "Verified (Government Portal)"
      : s.verification_status === "partially_verified" ? "Partially Verified"
      : s.verification_status === "unverified_url" ? "Source Needs Review"
      : "Source Not Verified",
    officialSource: s.official_url || "#",
    whyRelevant: "",
    recommendedAction: "",
  };
}

/**
 * Transform a backend application into the frontend shape.
 * Backend: { id, userId, schemeId, status, submittedAt, rejectionReason, nextAction, ... }
 * Frontend: { id, schemeId, name, status, reason, updatedAt, workflow, history }
 */
export function transformApplication(app) {
  // Map backend status to human-readable frontend status
  const statusMap = {
    draft: "Preparing Application",
    submitted: "Submitted to Department",
    under_review: "Under Review",
    action_required: "Action Required",
    approved: "Approved",
    rejected: "Rejected",
    ready_for_review: "Ready for Review",
  };

  const displayStatus = statusMap[app.status] || app.status || "Preparing Application";

  // If the backend stored prepared form_data, use its workflow/completion
  const fd = app.form_data || {};
  const hasPreparation = fd.completion_percentage !== undefined;

  // Build workflow object — prefer real preparation data over status-based defaults
  let workflow;
  if (fd.workflow) {
    workflow = fd.workflow;
  } else if (hasPreparation) {
    const fields = fd.fields || {};
    const missingFields = fd.missing_fields || [];
    const missingDocs = fd.missing_documents || [];
    workflow = {
      profile: fields.applicant_name ? "completed" : "attention",
      eligibility: missingFields.length === 0 ? "completed" : "in_progress",
      documents: missingDocs.length === 0 ? "completed" : (missingDocs.length > 0 ? "attention" : "pending"),
      application: fd.ready_to_submit ? "completed" : "in_progress",
      review: fd.ready_to_submit ? "in_progress" : "pending",
      otp: fd.ready_to_submit ? "locked" : "locked",
    };
  } else {
    const workflowMap = {
      draft: { profile: "completed", eligibility: "in_progress", documents: "pending", application: "pending", review: "pending", otp: "locked" },
      submitted: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
      under_review: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
      action_required: { profile: "completed", eligibility: "completed", documents: "attention", application: "pending", review: "pending", otp: "locked" },
      approved: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
      rejected: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
      ready_for_review: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "in_progress", otp: "locked" },
    };
    workflow = workflowMap[app.status] || workflowMap.draft;
  }

  return {
    id: app.id,
    schemeId: app.schemeId,
    name: app.schemeId, // scheme name resolved by frontend from schemes list
    status: displayStatus,
    reason: app.rejectionReason || app.nextAction || (hasPreparation ? fd.notes : "Processing..."),
    updatedAt: app.updated_at || app.submittedAt || "Recently",
    workflow,
    history: [],
    // Pass through real preparation data if available
    ...(hasPreparation ? {
      formFields: fd.fields || {},
      missingFields: fd.missing_fields || [],
      missingDocuments: fd.missing_documents || [],
      requiredDocuments: fd.required_documents || [],
      completionPercentage: fd.completion_percentage || 0,
      readyToSubmit: fd.ready_to_submit || false,
      preparationNotes: fd.notes || "",
    } : {}),
  };
}
