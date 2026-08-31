"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import {
  Check, AlertTriangle, CircleDot, Lock, Circle, Folder, X,
  FileText, ChevronDown, ChevronUp, Save, RotateCcw, ExternalLink, User,
  Send, RefreshCw, Clock, Shield
} from "lucide-react";

const C = {
  bg: "#E8F5E9",
  surface: "#FFFFFF",
  border: "#C8E6C9",
  green50: "#E8F5E9",
  green400: "#66BB6A",
  green700: "#2E7D32",
  green800: "#1B5E20",
  text: "#0A270D",
  muted: "#2E7D32",
  dim: "#81C784",
};

const stepStyles = {
  completed: { color: C.green700, bg: C.green50, border: C.border, Icon: Check },
  attention: { color: "#C62828", bg: "#FFEBEE", border: "#FFCDD2", Icon: AlertTriangle },
  in_progress: { color: "#E08E00", bg: "#FFF8E1", border: "#FFE082", Icon: CircleDot },
  locked: { color: C.dim, bg: C.green50, border: C.border, Icon: Lock },
  pending: { color: C.muted, bg: C.surface, border: C.border, Icon: Circle },
};

// Map field keys to human-readable labels
const fieldLabels = {
  applicant_name: "Applicant Name",
  applicant_email: "Email",
  applicant_age: "Age",
  applicant_gender: "Gender",
  state_of_domicile: "State of Domicile",
  caste_category: "Category",
  annual_family_income: "Family Annual Income",
  education_level: "Education Level",
  institution_name: "Institution",
  course_name: "Course",
  aadhaar_available: "Aadhaar Card",
  income_certificate_available: "Income Certificate",
  marksheet_available: "Marksheet",
  admission_letter_available: "Admission Letter",
  caste_certificate_available: "Caste Certificate",
  bank_passbook_available: "Bank Passbook",
};

// Fields that come from the user profile (editable)
const profileFields = [
  "applicant_name", "applicant_email", "applicant_age", "applicant_gender",
  "state_of_domicile", "caste_category", "annual_family_income",
  "education_level", "institution_name", "course_name",
];

function formatIncome(val) {
  if (!val) return null;
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ApplicationsPage() {
  const {
    applications, schemes, documents,
    askAgentAboutApplication, updateApplication, setPendingPrompt, prepareApplication,
  } = useApp();

  const [otpInput, setOtpInput] = useState("");
  const [otpModalApp, setOtpModalApp] = useState(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);
  const [editingFields, setEditingFields] = useState(null);
  const [savingField, setSavingField] = useState(null);
  const [loadingApp, setLoadingApp] = useState(null);
  const [mockSubmitting, setMockSubmitting] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(null);
  const [appEvents, setAppEvents] = useState({});

  const resolveSchemeName = (app) => {
    if (app.name && app.name !== app.schemeId) return app.name;
    const scheme = schemes.find((s) => s.id === app.schemeId);
    return scheme ? scheme.name : app.schemeId;
  };

  const pendingCount = applications.filter((a) =>
    ["Action Required", "Preparing Application"].includes(a.status)
  ).length;

  // Count documents available vs required for an app
  const getDocCounts = (app) => {
    if (!app.requiredDocuments) return null;
    const total = app.requiredDocuments.length;
    const missing = app.missingDocuments?.length || 0;
    return { total, available: total - missing, missing };
  };

  // Start editing a field
  const startEdit = (appId, fieldKey, currentValue) => {
    setEditingFields({ appId, fieldKey, value: currentValue ?? "" });
  };

  const cancelEdit = () => setEditingFields(null);

  const saveEdit = async (appId, fieldKey) => {
    if (!editingFields || editingFields.appId !== appId || editingFields.fieldKey !== fieldKey) return;
    setSavingField(fieldKey);

    // Find the application in state to get current form_data
    const app = applications.find((a) => a.id === appId);
    if (!app) { setSavingField(null); return; }

    const updatedFormData = {
      ...(app.formFields ? { fields: app.formFields } : {}),
      fields: { ...(app.formFields || {}), [fieldKey]: editingFields.value },
      missing_fields: app.missingFields || [],
      missing_documents: app.missingDocuments || [],
      required_documents: app.requiredDocuments || [],
      completion_percentage: app.completionPercentage || 0,
      ready_to_submit: app.readyToSubmit || false,
      notes: app.preparationNotes || "",
    };

    try {
      await updateApplication(appId, { form_data: updatedFormData });
    } catch (err) {
      console.error("Save failed:", err);
    }

    setSavingField(null);
    setEditingFields(null);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otpInput.trim() !== "123456") {
      alert("Invalid OTP code. For demo, use 123456.");
      return;
    }
    setIsVerifyingOtp(true);
    setTimeout(() => {
      updateApplication(otpModalApp.id, {
        status: "Submitted to Department",
        reason: "OTP verification completed. Form successfully submitted to official portal.",
      });
      setIsVerifyingOtp(false);
      setOtpModalApp(null);
      setOtpInput("");
    }, 1500);
  };

  // Mock submit handler
  const handleMockSubmit = async (appId) => {
    setMockSubmitting(appId);
    try {
      const res = await fetch("/api/applications/mock-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId }),
      });
      const data = await res.json();
      if (data.error) {
        console.error("Mock submit failed:", data.error);
        alert("Submission failed. Please try again.");
      } else {
        // Refresh applications
        updateApplication(appId, { status: "Submitted (Demo)" });
        // Fetch updated events
        fetchEvents(appId);
      }
    } catch (err) {
      console.error("Mock submit error:", err);
    }
    setMockSubmitting(null);
  };

  // Status check handler
  const handleStatusCheck = async (appId) => {
    setCheckingStatus(appId);
    try {
      const res = await fetch("/api/applications/status-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId }),
      });
      const data = await res.json();
      if (data.status_changed) {
        updateApplication(appId, { status: data.new_status });
      }
      fetchEvents(appId);
    } catch (err) {
      console.error("Status check error:", err);
    }
    setCheckingStatus(null);
  };

  // Fetch events for an application
  const fetchEvents = async (appId) => {
    try {
      const res = await fetch(`/api/applications/events?application_id=${appId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppEvents((prev) => ({ ...prev, [appId]: data }));
      }
    } catch (err) {
      console.error("Fetch events error:", err);
    }
  };

  return (
    <div style={{ minHeight: "100%", background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "1.25rem" }}>

      {/* Mobile tabs */}
      <div className="flex lg:hidden" style={{ marginBottom: "1rem", gap: "0.5rem", overflowX: "auto" }}>
        {[
          { href: "/chat", label: "Chat", active: false },
          { href: "/explore", label: "Explore", active: false, count: schemes.length },
          { href: "/applications", label: "Applications", active: true, count: pendingCount || null },
        ].map(({ href, label, active, count }) => (
          <Link key={href} href={href} style={{ flexShrink: 0, padding: "0.375rem 0.875rem", borderRadius: 9999, background: active ? C.green800 : C.surface, color: active ? "#fff" : C.green700, fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", border: `1px solid ${active ? C.green800 : C.border}` }}>
            {label}{count ? ` (${count})` : ""}
          </Link>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: C.green800 }}>Application Workspace</h1>
          <p style={{ fontSize: "0.9rem", color: C.muted, marginTop: 6 }}>
            Track what your agent prepared, review form fields, and complete identity verification.
          </p>
        </div>

        {/* Empty state */}
        {applications.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "3rem", textAlign: "center" }}>
            <span style={{ display: "flex", justifyContent: "center" }}><Folder size={40} color="#81C784" /></span>
            <h3 style={{ fontWeight: 700, color: C.green800, marginTop: 12 }}>No applications yet</h3>
            <p style={{ fontSize: "0.875rem", color: C.muted, marginTop: 6 }}>Choose a scheme and let Iva prepare the application for you.</p>
            <Link href="/explore" style={{ display: "inline-block", marginTop: 20, padding: "0.625rem 1.25rem", background: C.green800, color: "#fff", borderRadius: 9999, fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
              Explore Schemes
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {applications.map((app) => {
              const hasAttention = Object.values(app.workflow || {}).includes("attention");
              const canReview = app.workflow?.review === "in_progress" || app.workflow?.review === "attention";
              const isDisbursed = app.status?.includes("Disbursed");
              const isDraft = app.status === "Preparing Application";
              const hasPrep = app.completionPercentage !== undefined;
              const resolvedName = resolveSchemeName(app);
              const docCounts = getDocCounts(app);
              const isExpanded = expandedApp === app.id;
              const accent = hasAttention ? "#C62828" : isDisbursed ? C.green700 : isDraft ? C.dim : "#E08E00";

              return (
                <div key={app.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, borderRadius: "1rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* ── Header row ── */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", flex: "1 1 300px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text }}>{resolvedName}</h3>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", padding: "3px 8px", borderRadius: 9999, background: hasAttention ? "#FFEBEE" : C.green50, color: accent, border: `1px solid ${hasAttention ? "#FFCDD2" : C.border}` }}>
                        {app.status}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: C.dim }}>Updated: {app.updatedAt}</span>
                  </div>

                  {/* ── Current phase ── */}
                  <p style={{ fontSize: "0.8rem", color: C.muted, padding: "0.6rem 0.75rem", background: C.green50, borderRadius: "0.5rem", lineHeight: 1.5 }}>
                    <strong>Next step:</strong> {app.reason}
                  </p>

                  {/* ── Completion progress bar ── */}
                  {hasPrep && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.text }}>Application readiness</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: C.green800 }}>{Math.round(app.completionPercentage)}%</span>
                      </div>
                      <div style={{ width: "100%", height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${app.completionPercentage}%`, height: "100%", background: app.completionPercentage >= 80 ? C.green700 : app.completionPercentage >= 50 ? "#E08E00" : "#C62828", borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* ── Workflow pipeline ── */}
                  {app.workflow && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        { label: "Profile", key: "profile" },
                        { label: "Eligibility", key: "eligibility" },
                        { label: "Documents", key: "documents" },
                        { label: "Form", key: "application" },
                        { label: "Review", key: "review" },
                        { label: "OTP", key: "otp" },
                      ].map(({ label, key }) => {
                        const state = app.workflow[key] || "pending";
                        const style = stepStyles[state] || stepStyles.pending;
                        return (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.25rem 0.5rem", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                            {React.createElement(style.Icon, { size: 11 })}
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Doc counts summary ── */}
                  {docCounts && (
                    <div style={{ fontSize: "0.75rem", color: C.muted }}>
                      Documents: <strong>{docCounts.available}/{docCounts.total}</strong> available
                      {docCounts.missing > 0 && (
                        <span style={{ color: "#C62828", marginLeft: 8 }}>
                          ({docCounts.missing} missing)
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Missing info / documents ── */}
                  {hasPrep && (app.missingFields?.length > 0 || app.missingDocuments?.length > 0) && (
                    <div style={{ padding: "0.6rem 0.75rem", background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#5D4037" }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Information needed</div>
                      {app.missingFields?.map((f) => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <AlertTriangle size={11} color="#E08E00" />
                          {fieldLabels[f] || f.replace(/_/g, " ")}
                        </div>
                      ))}
                      {app.missingDocuments?.map((d) => (
                        <div key={d} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <FileText size={11} color="#C62828" />
                          {d}
                          <Link href="/documents" style={{ marginLeft: 4, fontSize: "0.68rem", color: C.green800, fontWeight: 700, textDecoration: "underline" }}>
                            View Documents
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Action buttons ── */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button type="button" onClick={() => askAgentAboutApplication({ ...app, name: resolvedName })} style={{ padding: "0.45rem 0.875rem", borderRadius: "0.5rem", border: "none", background: hasAttention ? "#C62828" : C.green50, color: hasAttention ? "#fff" : C.green800, fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {hasAttention ? "Ask Agent" : "Ask Agent"}
                    </button>
                    <button type="button" onClick={() => setExpandedApp(isExpanded ? null : app.id)} style={{ padding: "0.45rem 0.875rem", borderRadius: "0.5rem", border: `1px solid ${C.border}`, background: C.surface, color: C.green800, fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />} Form Fields
                    </button>
                    {canReview && (
                      <button type="button" onClick={() => setOtpModalApp(app)} style={{ padding: "0.45rem 0.875rem", borderRadius: "0.5rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                        <Lock size={11} /> Provide OTP Consent
                      </button>
                    )}
                    {app.readyToSubmit && (
                      <button
                        type="button"
                        onClick={() => handleMockSubmit(app.id)}
                        disabled={mockSubmitting === app.id}
                        style={{ padding: "0.45rem 0.875rem", borderRadius: "0.5rem", border: "none", background: "#E08E00", color: "#fff", fontWeight: 700, fontSize: "0.75rem", cursor: mockSubmitting === app.id ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, opacity: mockSubmitting === app.id ? 0.6 : 1 }}
                      >
                        {mockSubmitting === app.id ? (
                          <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                        ) : (
                          <Send size={11} />
                        )}
                        {mockSubmitting === app.id ? "Submitting..." : "Submit to Portal (Demo)"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStatusCheck(app.id)}
                      disabled={checkingStatus === app.id}
                      style={{ padding: "0.45rem 0.875rem", borderRadius: "0.5rem", border: `1px solid ${C.border}`, background: C.surface, color: C.green800, fontWeight: 700, fontSize: "0.75rem", cursor: checkingStatus === app.id ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, opacity: checkingStatus === app.id ? 0.6 : 1 }}
                    >
                      {checkingStatus === app.id ? (
                        <span style={{ width: 12, height: 12, border: "2px solid rgba(30,125,50,0.3)", borderTopColor: C.green800, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                      ) : (
                        <RefreshCw size={11} />
                      )}
                      Check Status
                    </button>
                  </div>

                  {/* ── Expandable form fields section ── */}
                  {isExpanded && hasPrep && app.formFields && (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, marginBottom: 8 }}>Prepared Form Fields</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                        {Object.entries(app.formFields).map(([key, rawValue]) => {
                          // Support both old format (primitive) and new format ({value, source, verified})
                          const fieldData = rawValue && typeof rawValue === "object" && "value" in rawValue ? rawValue : { value: rawValue, source: "profile", verified: false };
                          const value = fieldData.value;
                          const source = fieldData.source || "profile";
                          const verified = fieldData.verified || false;
                          const isProfileField = profileFields.includes(key);
                          const isBoolean = typeof value === "boolean";
                          const isEditing = editingFields?.appId === app.id && editingFields?.fieldKey === key;
                          const hasValue = value !== null && value !== undefined && value !== false;

                          return (
                            <div key={key} style={{ padding: "0.5rem 0.625rem", background: hasValue ? C.green50 : "#FFF8E1", border: `1px solid ${hasValue ? C.border : "#FFE082"}`, borderRadius: "0.5rem" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ fontSize: "0.62rem", color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{fieldLabels[key] || key.replace(/_/g, " ")}</div>
                                {verified && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: C.green700, color: "#fff" }}>✓ Verified</span>}
                              </div>

                              {isBoolean ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: "0.78rem", fontWeight: 600, color: value ? C.green700 : "#C62828" }}>
                                  {value ? <Check size={12} /> : <AlertTriangle size={12} />}
                                  {value ? "Available" : "Missing"}
                                </div>
                              ) : isEditing ? (
                                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                  <input
                                    type={key === "annual_family_income" ? "number" : key === "applicant_age" ? "number" : "text"}
                                    value={editingFields.value}
                                    onChange={(e) => setEditingFields({ ...editingFields, value: e.target.value })}
                                    autoFocus
                                    style={{ flex: 1, fontSize: "0.78rem", padding: "0.25rem 0.4rem", border: `1px solid ${C.border}`, borderRadius: 4, fontFamily: "inherit", outline: "none" }}
                                  />
                                  <button type="button" onClick={() => saveEdit(app.id, key)} disabled={savingField === key} style={{ padding: "0.2rem 0.4rem", borderRadius: 4, border: "none", background: C.green800, color: "#fff", cursor: "pointer", fontSize: "0.68rem" }}>
                                    <Save size={10} />
                                  </button>
                                  <button type="button" onClick={cancelEdit} style={{ padding: "0.2rem 0.4rem", borderRadius: 4, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontSize: "0.68rem" }}>
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => isProfileField && startEdit(app.id, key, value)}
                                  style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text, marginTop: 4, cursor: isProfileField ? "pointer" : "default", display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  {hasValue ? (
                                    <>
                                      {key === "annual_family_income" ? formatIncome(value) : String(value)}
                                      {isProfileField && <span style={{ fontSize: "0.6rem", color: C.dim }}>(tap to edit)</span>}
                                    </>
                                  ) : (
                                    <span style={{ color: "#E08E00", fontStyle: "italic" }}>Missing</span>
                                  )}
                                </div>
                              )}

                              {/* Source indicator */}
                              <div style={{ fontSize: "0.58rem", color: C.dim, marginTop: 2 }}>
                                {source === "document" ? "From verified document" : source === "profile" ? "From profile" : "System"}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Required documents list */}
                      {app.requiredDocuments?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, marginBottom: 6 }}>Required Documents</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {app.requiredDocuments.map((doc) => {
                              const isMissing = app.missingDocuments?.includes(doc);
                              return (
                                <span key={doc} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0.25rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: isMissing ? "#FFEBEE" : C.green50, color: isMissing ? "#C62828" : C.green700, border: `1px solid ${isMissing ? "#FFCDD2" : C.border}` }}>
                                  {isMissing ? <AlertTriangle size={10} /> : <Check size={10} />}
                                  {doc}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* OTP handoff notice */}
                      {app.readyToSubmit && (
                        <div style={{ marginTop: 12, padding: "0.75rem", background: C.green50, border: `1px solid ${C.border}`, borderRadius: "0.5rem", fontSize: "0.78rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: C.green800, marginBottom: 4 }}>
                            <Lock size={14} /> Identity verification required
                          </div>
                          <p style={{ color: C.muted, lineHeight: 1.5 }}>
                            Your application is ready. Complete OTP/CAPTCHA and final submission on the official portal.
                          </p>
                          <button type="button" onClick={() => setOtpModalApp(app)} style={{ marginTop: 8, padding: "0.4rem 0.875rem", borderRadius: "0.5rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
                            Continue to Submission
                          </button>
                        </div>
                      )}

                      {/* Event timeline */}
                      {appEvents[app.id] && appEvents[app.id].length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} /> Event Timeline
                          </div>
                          <div style={{ position: "relative", paddingLeft: 16 }}>
                            {/* Timeline line */}
                            <div style={{ position: "absolute", left: 5, top: 0, bottom: 0, width: 2, background: C.border }} />
                            {appEvents[app.id].map((event, idx) => (
                              <div key={event.event_id || idx} style={{ position: "relative", marginBottom: 8, padding: "0.375rem 0.5rem", background: event.event_type === "mock_submission" ? "#FFF8E1" : event.event_type === "status_change" ? C.green50 : C.surface, border: `1px solid ${event.event_type === "mock_submission" ? "#FFE082" : C.border}`, borderRadius: 6, fontSize: "0.68rem" }}>
                                {/* Timeline dot */}
                                <div style={{ position: "absolute", left: -14, top: 8, width: 8, height: 8, borderRadius: "50%", background: event.event_type === "mock_submission" ? "#E08E00" : event.event_type === "preparation" ? C.green700 : C.dim, border: `2px solid ${C.surface}` }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontWeight: 600, color: C.text }}>{event.event_type.replace(/_/g, " ")}</span>
                                  <span style={{ fontSize: "0.58rem", color: C.dim }}>{new Date(event.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p style={{ color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{event.message}</p>
                                {event.triggered_by && (
                                  <span style={{ fontSize: "0.55rem", color: C.dim, marginTop: 2, display: "inline-block" }}>
                                    by: {event.triggered_by}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── OTP Modal ── */}
      {otpModalApp && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,39,13,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: 400, width: "100%" }}>
            <button type="button" onClick={() => setOtpModalApp(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: C.dim, display: "flex", alignItems: "center" }}><X size={18} /></button>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#C62828", textTransform: "uppercase" }}>Identity verification</span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text, marginTop: 4 }}>OTP consent required</h3>
            <p style={{ fontSize: "0.82rem", color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              Your application for <strong>{resolveSchemeName(otpModalApp)}</strong> is ready. Government portals require your manual OTP to submit.
            </p>
            <div style={{ marginTop: 12, padding: "0.75rem", background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: "0.625rem", fontSize: "0.78rem", color: "#5D4037" }}>
              Demo bypass code: <strong>123456</strong>
            </div>
            <form onSubmit={handleOtpSubmit} style={{ marginTop: 16 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text }}>Enter 6-digit OTP</label>
              <input
                type="text" maxLength={6} required placeholder="123456"
                value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 6, padding: "0.75rem", border: `1px solid ${C.border}`, borderRadius: "0.625rem", textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em", fontFamily: "monospace" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="button" onClick={() => setOtpModalApp(null)} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.625rem", border: `1px solid ${C.border}`, background: C.green50, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button type="submit" disabled={isVerifyingOtp} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.625rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {isVerifyingOtp ? "Verifying..." : "Verify & Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
