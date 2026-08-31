"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import {
  FileText, AlertTriangle, Check, Folder, Lightbulb,
  Clock, XCircle, CheckCircle, AlertCircle, Trash2, Shield
} from "lucide-react";

// Map document_type values to display-friendly names
const docTypeLabels = {
  aadhaar: "Aadhaar Card",
  income_certificate: "Income Certificate",
  caste_certificate: "Caste Certificate",
  marksheet: "Marksheet",
  admission_letter: "Admission Letter",
  bank_passbook: "Bank Passbook",
  domicile_certificate: "Domicile Certificate",
  disability_certificate: "Disability Certificate",
};

function daysUntilExpiry(expiryDate) {
  if (!expiryDate || expiryDate === "Never") return 999;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DocumentsPage() {
  const { documents, applications, schemes, uploadDocument, deleteDocument, setDemoScenario, refreshData, loading } = useApp();
  const [docType, setDocType] = useState("Income Certificate (FY 2026-27)");
  const [expiryDate, setExpiryDate] = useState("2027-03-31");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeScenario, setActiveScenario] = useState("fully_verified");

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      uploadDocument(docType, expiryDate);
      setIsUploading(false);
      setDocType("Income Certificate (FY 2026-27)");
    }, 1200);
  };

  const handleDelete = async (docId) => {
    setDeletingId(docId);
    await deleteDocument(docId);
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleScenarioChange = async (scenario) => {
    setActiveScenario(scenario);
    await setDemoScenario(scenario);
    // Refresh data after scenario switch
    if (typeof refreshData === 'function') refreshData();
  };

  // Get expiry from document - handle both backend formats
  const getExpiry = (doc) => {
    if (doc.expiryDate) return doc.expiryDate;
    if (doc.expiry_date) return doc.expiry_date;
    if (doc.extracted_fields?.expiryDate) return doc.extracted_fields.expiryDate;
    return null;
  };

  // Get display name for a document
  const getDocDisplayName = (doc) => {
    return docTypeLabels[doc.document_type] || doc.document_type?.replace(/_/g, " ") || "Unknown Document";
  };

  // Find which applications use a given document type
  const getLinkedApps = (docType) => {
    const normalizedType = (docType || "").toLowerCase().replace(/[^a-z]/g, "");
    const linked = [];
    for (const app of applications) {
      const reqDocs = app.requiredDocuments || [];
      const isRequired = reqDocs.some((rd) => {
        const normalized = rd.toLowerCase().replace(/[^a-z]/g, "");
        return normalized.includes(normalizedType) || normalizedType.includes(normalized);
      });
      if (isRequired) {
        const scheme = schemes.find((s) => s.id === app.schemeId);
        linked.push(scheme?.name || app.schemeId);
      }
    }
    return linked;
  };

  // Compute status info for a document
  const getStatusInfo = (doc) => {
    const expiry = getExpiry(doc);
    const days = daysUntilExpiry(expiry);
    if (days < 30 && days !== 999) {
      return { color: "#C62828", bg: "#FFEBEE", border: "#FFCDD2", label: "Expiring Soon", Icon: AlertCircle, detail: `Expires in ${days} days` };
    }
    const statusLower = (doc.status || "").toLowerCase();
    if (statusLower === "verified" || statusLower === "valid") {
      const isDemo = doc.demo_seeded || doc.verification_metadata?.government_verification?.type?.includes("MOCK");
      return {
        color: C.green700, bg: C.green50, border: C.border,
        label: isDemo ? "Mock Verified" : "Verified",
        Icon: CheckCircle,
        detail: isDemo ? "Mock Verified for Demo" : "Verified",
      };
    }
    if (statusLower === "expired") {
      return { color: "#C62828", bg: "#FFEBEE", border: "#FFCDD2", label: "Expired", Icon: XCircle, detail: "Document expired" };
    }
    if (statusLower === "rejected") {
      return { color: "#C62828", bg: "#FFEBEE", border: "#FFCDD2", label: "Rejected", Icon: XCircle, detail: "Document rejected" };
    }
    return { color: "#E08E00", bg: "#FFF8E1", border: "#FFE082", label: doc.status || "Pending", Icon: Clock, detail: "Awaiting verification" };
  };

  // Format extracted fields for display
  const formatExtractedField = (key, value) => {
    if (key === "expiryDate") return null; // Already shown separately
    if (key === "annual_income") return `Income: ${formatIncomeDisplay(value)}`;
    if (key === "percentage") return `Score: ${value}%`;
    if (typeof value === "boolean") return value ? key.replace(/_/g, " ") : null;
    return `${key.replace(/_/g, " ")}: ${value}`;
  };
  const formatIncomeDisplay = (val) => {
    if (!val) return "--";
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  };

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

  return (
    <div style={{ minHeight: "100%", background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "1.25rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem", borderBottom: `1px solid ${C.border}`, paddingBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: C.green800 }}>Document Vault</h1>
              <p style={{ fontSize: "0.9rem", color: C.muted, marginTop: 6 }}>
                Your certificates. Iva uses these to verify eligibility and prepare applications.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Scenario Switcher */}
        <div style={{ marginBottom: "1.25rem", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.75rem", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Shield size={14} color={C.green700} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.green800 }}>DEMO SCENARIO</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => handleScenarioChange("fully_verified")}
              style={{
                flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                border: `1px solid ${activeScenario === "fully_verified" ? C.green700 : C.border}`,
                background: activeScenario === "fully_verified" ? C.green50 : C.surface,
                color: activeScenario === "fully_verified" ? C.green800 : C.muted,
                fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <CheckCircle size={12} />
              Fully Verified
            </button>
            <button
              type="button"
              onClick={() => handleScenarioChange("needs_documents")}
              style={{
                flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                border: `1px solid ${activeScenario === "needs_documents" ? "#E08E00" : C.border}`,
                background: activeScenario === "needs_documents" ? "#FFF8E1" : C.surface,
                color: activeScenario === "needs_documents" ? "#5D4037" : C.muted,
                fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <AlertCircle size={12} />
              Needs Documents
            </button>
          </div>
          <p style={{ fontSize: "0.7rem", color: C.dim, marginTop: 8 }}>
            {activeScenario === "fully_verified"
              ? "Complete profile + all documents verified. Applications should populate fully."
              : "Some documents missing/unverified. Agent will explain what's needed."
            }
          </p>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Left: Documents list */}
          <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "3rem", textAlign: "center" }}>
                <div style={{ width: 24, height: 24, border: `3px solid ${C.border}`, borderTopColor: C.green700, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "0.875rem", color: C.muted }}>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "3rem", textAlign: "center" }}>
                <span style={{ display: "flex", justifyContent: "center" }}><FileText size={40} color="#81C784" /></span>
                <h3 style={{ fontWeight: 700, color: C.green800, marginTop: 12 }}>No documents yet</h3>
                <p style={{ fontSize: "0.875rem", color: C.muted, marginTop: 6 }}>Upload the documents you use for your applications. Iva will help identify which ones are required.</p>
              </div>
            ) : (
              documents.map((doc) => {
                const status = getStatusInfo(doc);
                const expiry = getExpiry(doc);
                const linkedApps = getLinkedApps(doc.document_type);
                const displayName = getDocDisplayName(doc);

                return (
                  <div key={doc.id} style={{ background: C.surface, border: `1px solid ${status.border}`, borderRadius: "0.75rem", padding: "1rem", transition: "all 0.15s" }}>
                    {/* Status + type + delete */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim }}>Document</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                          {React.createElement(status.Icon, { size: 11 })}
                          {status.label}
                        </span>
                        {confirmDelete === doc.id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingId === doc.id}
                              style={{ padding: "2px 6px", borderRadius: 4, border: "none", background: "#C62828", color: "#fff", fontSize: "0.6rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              {deletingId === doc.id ? "..." : "Yes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.surface, fontSize: "0.6rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(doc.id)}
                            style={{ padding: 4, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", color: C.dim }}
                            title="Delete document"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Document name */}
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.text }}>{displayName}</h3>                    {/* Status detail */}
                    <p style={{ fontSize: "0.75rem", color: status.color, marginTop: 4, fontWeight: 600 }}>{status.detail}</p>

                    {/* Extracted fields */}
                    {doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                        {Object.entries(doc.extracted_fields).map(([key, value]) => {
                          const display = formatExtractedField(key, value);
                          if (!display) return null;
                          return (
                            <div key={key} style={{ fontSize: "0.68rem", color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, flexShrink: 0 }} />
                              {display}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Expiry info */}
                    {expiry && expiry !== "Never" && (
                      <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: 4 }}>
                        Expires: {new Date(expiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}

                    {/* Linked applications */}
                    {linkedApps.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.green50}` }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim }}>Used for</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {linkedApps.map((name, idx) => (
                            <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 4, fontSize: "0.68rem", fontWeight: 600, background: C.green50, color: C.green700, border: `1px solid ${C.border}` }}>
                              <Folder size={10} />{name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Upload form */}
          <div style={{ flex: "0 1 320px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0.75rem", padding: "1.25rem", position: "sticky", top: 6 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Add Document</h3>
            <p style={{ fontSize: "0.75rem", color: C.muted, marginBottom: 12 }}>Upload certificates to update your profile for scheme matching.</p>

            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: C.green800, display: "block", marginBottom: 4 }}>Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.border}`, borderRadius: "0.5rem", fontSize: "0.8rem", fontFamily: "inherit", color: C.text, background: "#fff" }}
                >
                  <option value="Income Certificate (FY 2026-27)">Income Certificate (FY 2026-27)</option>
                  <option value="Caste Certificate">Caste Certificate</option>
                  <option value="Domicile Certificate">Domicile Certificate</option>
                  <option value="Class 12 Passing Certificate">Class 12 Passing Certificate</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Bank Passbook">Bank Passbook</option>
                  <option value="Admission Letter">Admission Letter</option>
                  <option value="Marksheet">Marksheet</option>
                  <option value="Disability Certificate">Disability Certificate</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: C.green800, display: "block", marginBottom: 4 }}>Expiry Date</label>
                <input
                  type="date" required value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.border}`, borderRadius: "0.5rem", fontSize: "0.8rem", fontFamily: "inherit", color: C.text, background: "#fff" }}
                />
              </div>

              <div style={{ padding: "0.5rem", background: C.green50, border: `1px solid ${C.border}`, borderRadius: "0.5rem", fontSize: "0.7rem", color: C.muted, display: "flex", alignItems: "flex-start", gap: 6 }}>
                <Lightbulb size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                Document metadata is stored for eligibility verification and application preparation.
              </div>

              <button
                type="submit" disabled={isUploading}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, fontSize: "0.8rem", cursor: isUploading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isUploading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {isUploading ? (
                  <>
                    <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                    Adding document...
                  </>
                ) : (
                  "Add Document"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
