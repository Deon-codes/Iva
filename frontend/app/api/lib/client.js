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
  return {
    id: s.id,
    name: s.name,
    department: s.department,
    benefit: s.benefits_summary || "",
    eligibility: s.eligibility_summary || "",
    deadline: "2026-12-31", // fallback for list items without deadline
    requiredDocuments: [],
    legitimacyStatus: "Verified (Government Portal)",
    officialSource: s.official_url || "#",
    whyRelevant: "",
    recommendedAction: "",
  };
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
    legitimacyStatus: "Verified (Government Portal)",
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
  };

  const displayStatus = statusMap[app.status] || app.status || "Preparing Application";

  // Build workflow object from status
  const workflowMap = {
    draft: { profile: "completed", eligibility: "in_progress", documents: "pending", application: "pending", review: "pending", otp: "locked" },
    submitted: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
    under_review: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
    action_required: { profile: "completed", eligibility: "completed", documents: "attention", application: "pending", review: "pending", otp: "locked" },
    approved: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
    rejected: { profile: "completed", eligibility: "completed", documents: "completed", application: "completed", review: "completed", otp: "completed" },
  };

  return {
    id: app.id,
    schemeId: app.schemeId,
    name: app.schemeId, // scheme name will be resolved by frontend from schemes list
    status: displayStatus,
    reason: app.rejectionReason || app.nextAction || "Processing...",
    updatedAt: app.updated_at || app.submittedAt || "Recently",
    workflow: workflowMap[app.status] || workflowMap.draft,
    history: [],
  };
}
