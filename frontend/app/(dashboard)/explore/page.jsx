"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { X, RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const C = {
  bg: "#E8F5E9",
  surface: "#FFFFFF",
  border: "#C8E6C9",
  green50: "#E8F5E9",
  green100: "#C8E6C9",
  green400: "#66BB6A",
  green700: "#2E7D32",
  green800: "#1B5E20",
  text: "#0A270D",
  muted: "#2E7D32",
  dim: "#81C784",
};

const DEPT_COLORS = {
  "Social Justice and Special Assistance Department": "#4CAF50",
  "Department of Higher Education (MHRD)": "#2196F3",
  "All India Council for Technical Education (AICTE)": "#FF9800",
  "Ministry of Social Justice and Empowerment": "#9C27B0",
};

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "verified", label: "Verified" },
  { id: "closing", label: "Closing Soon" },
];

// 30-day threshold for "closing soon"
const CLOSING_SOON_DAYS = 30;

export default function ExplorePage() {
  const { schemes, user, askAgentAboutScheme, prepareApplication, applications } = useApp();
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshError, setRefreshError] = useState(null);

  // Fetch metadata on mount
  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/schemes/meta");
      if (res.ok) {
        const data = await res.json();
        setLastUpdated(data.last_updated);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/schemes/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLastUpdated(data.last_updated);
        // Trigger data reload by calling refreshData from AppContext if available
        window.location.reload();
      } else {
        setRefreshError("Couldn't refresh right now. Showing the last available data.");
      }
    } catch {
      setRefreshError("Couldn't refresh right now. Showing the last available data.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const formatLastUpdated = (ts) => {
    if (!ts) return "Not yet synced";
    try {
      const d = new Date(ts);
      const now = new Date();
      const diffMin = Math.floor((now - d) / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Unknown";
    }
  };

  const pendingCount = applications.filter((a) =>
    ["Action Required", "Preparing Application"].includes(a.status)
  ).length;

  const filtered = schemes.filter((scheme) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      scheme.name.toLowerCase().includes(q) ||
      scheme.department.toLowerCase().includes(q);

    let matchesFilter = true;
    if (filter === "verified") {
      // Use real backend verification_status from scheme summary
      matchesFilter = scheme.legitimacyStatus === "Verified (Government Portal)"
        || scheme.legitimacyStatus === "Partially Verified";
    } else if (filter === "closing") {
      // Only include schemes with an actual deadline within 30 days
      // Exclude schemes with null/undefined deadline (they don't "close")
      if (!scheme.deadline) {
        matchesFilter = false;
      } else {
        const deadline = new Date(scheme.deadline);
        const now = new Date();
        const threshold = new Date(now.getTime() + CLOSING_SOON_DAYS * 86400000);
        matchesFilter = !isNaN(deadline.getTime()) && deadline <= threshold && deadline >= now;
      }
    }

    return matchesSearch && matchesFilter;
  });

  const getDeptInitial = (dept) => {
    return dept?.charAt(0)?.toUpperCase() || "S";
  };

  const getDeptColor = (dept) => {
    return DEPT_COLORS[dept] || "#4CAF50";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Rolling";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Rolling";
    const now = new Date();
    const diffDays = Math.ceil((d - now) / 86400000);
    if (diffDays < 0) return "Expired";
    if (diffDays < 7) return `${diffDays}d left`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ minHeight: "100%", background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Mobile Layout ─────────────────────────────────────────────── */}
      <div className="block lg:hidden">
        {/* Mobile Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 16px 12px",
          }}
        >
          <Link
            href="/chat"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.surface,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
              Discover
            </h1>
            <p style={{ fontSize: "0.75rem", color: C.dim, marginTop: 1 }}>
              Schemes &amp; opportunities for you
            </p>
          </div>
          {/* Refresh + last updated */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: "0.6rem", color: C.dim, textAlign: "right", maxWidth: 60, lineHeight: 1.2 }}>
              {formatLastUpdated(lastUpdated)}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: C.surface,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isRefreshing ? "wait" : "pointer",
                flexShrink: 0,
                opacity: isRefreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} color={C.green700} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {refreshError && (
          <div style={{ padding: "0 16px 8px", fontSize: "0.75rem", color: "#E08E00", background: "#FFF8E1", borderRadius: 8, margin: "0 16px 8px", padding: "8px 12px" }}>
            <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {refreshError}
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "0 12px",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schemes…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.875rem",
                color: C.text,
                padding: "10px 0",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            type="button"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: C.surface,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
              <circle cx="6" cy="12" r="2" fill={C.green700} />
              <circle cx="10" cy="18" r="2" fill={C.green700} />
            </svg>
          </button>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 16px 16px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {FILTER_OPTIONS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                style={{
                  flexShrink: 0,
                  padding: "7px 16px",
                  borderRadius: 20,
                  border: `1px solid ${active ? C.green800 : C.border}`,
                  background: active ? C.green800 : C.surface,
                  color: active ? "#fff" : C.green700,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Scheme List */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((scheme, index) => {
            const isEligibleMatch = scheme.id !== "pragati-girls" || user?.category === "Female";
            const deptColor = getDeptColor(scheme.department);
            return (
              <div
                key={scheme.id}
                onClick={() => setSelectedScheme(scheme)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 0",
                  borderBottom: index < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer",
                  opacity: isEligibleMatch ? 1 : 0.6,
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: `${deptColor}18`,
                    border: `1px solid ${deptColor}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: deptColor,
                  }}
                >
                  {getDeptInitial(scheme.department)}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: C.text,
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      margin: 0,
                    }}
                  >
                    {scheme.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: C.dim,
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {scheme.department}
                  </p>
                </div>

                {/* Right meta */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: C.green700,
                      background: C.green50,
                      border: `1px solid ${C.border}`,
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    {formatDate(scheme.deadline)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: C.muted, fontSize: "0.875rem" }}>
            No schemes match your search.
          </div>
        )}
      </div>

      {/* ── Desktop Layout ────────────────────────────────────────────── */}
      <div className="hidden lg:block" style={{ padding: "1.25rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: C.green800 }}>Explore Opportunities</h1>
              <p style={{ fontSize: "0.9rem", color: C.muted, marginTop: 6, maxWidth: 640 }}>
                Personalized schemes for {user?.name || "your profile"} — {user?.state}, {user?.education}, {user?.category}, income {user?.incomeRange || "on file"}.
              </p>
            </div>
            {/* Refresh + last updated */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 4 }}>
              <span style={{ fontSize: "0.7rem", color: C.dim, textAlign: "right" }}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0.4rem 0.75rem",
                  borderRadius: 9999,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.green700,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: isRefreshing ? "wait" : "pointer",
                  fontFamily: "inherit",
                  opacity: isRefreshing ? 0.6 : 1,
                }}
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {refreshError && (
            <div style={{ marginBottom: "1rem", fontSize: "0.8rem", color: "#E08E00", background: "#FFF8E1", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} />
              {refreshError}
            </div>
          )}

          {/* Search & filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schemes…"
              style={{ flex: "1 1 220px", padding: "0.625rem 1rem", borderRadius: 9999, border: `1px solid ${C.border}`, background: C.surface, fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }}
            />
            {FILTER_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                style={{ padding: "0.5rem 1rem", borderRadius: 9999, border: `1px solid ${filter === id ? C.green800 : C.border}`, background: filter === id ? C.green800 : C.surface, color: filter === id ? "#fff" : C.green700, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Scheme grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {filtered.map((scheme) => {
              const isEligibleMatch = scheme.id !== "pragati-girls" || user?.category === "Female";
              return (
                <div key={scheme.id} className="scheme-card" style={{ opacity: isEligibleMatch ? 1 : 0.65, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: C.dim }}>{scheme.department}</span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {/* Match indicator */}
                      {scheme.eligibility_status && (
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 9999, background: scheme.eligibility_status === "eligible" ? C.green50 : scheme.eligibility_status === "insufficient_information" ? "#FFF8E1" : "#FFEBEE", color: scheme.eligibility_status === "eligible" ? C.green700 : scheme.eligibility_status === "insufficient_information" ? "#E08E00" : "#C62828", border: `1px solid ${scheme.eligibility_status === "eligible" ? C.border : scheme.eligibility_status === "insufficient_information" ? "#FFE082" : "#FFCDD2"}` }}>
                          {scheme.eligibility_status === "eligible" ? "Strong match" : scheme.eligibility_status === "insufficient_information" ? "Needs info" : "Not a match"}
                        </span>
                      )}
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.green700, background: C.green50, border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: 9999 }}>{scheme.legitimacyStatus}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{scheme.name}</h3>
                  <div style={{ marginTop: 10, padding: "0.625rem", background: C.green50, borderRadius: "0.625rem", border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: C.green700 }}>Benefit</span>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, marginTop: 4 }}>{scheme.benefit}</p>
                  </div>
                  {/* Match reasons when personalized */}
                  {scheme.match_reasons && scheme.match_reasons.length > 0 && (
                    <div style={{ marginTop: 10, borderLeft: `3px solid ${scheme.eligibility_status === "eligible" ? C.green400 : scheme.eligibility_status === "insufficient_information" ? "#FFE082" : "#FFCDD2"}`, paddingLeft: 10 }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: C.dim }}>Why this matches</span>
                      {scheme.match_reasons.map((reason, idx) => (
                        <p key={idx} style={{ fontSize: "0.75rem", color: C.muted, marginTop: 2 }}>{reason}</p>
                      ))}
                    </div>
                  )}
                  {/* Fallback: static why relevant */}
                  {!scheme.match_reasons && (
                    <div style={{ marginTop: 10, borderLeft: `3px solid ${C.green400}`, paddingLeft: 10 }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: C.dim }}>Why relevant</span>
                      <p style={{ fontSize: "0.78rem", color: C.muted, marginTop: 4, fontStyle: "italic" }}>{scheme.whyRelevant}</p>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: "0.78rem" }}>
                    <div>
                      <span style={{ color: C.dim, fontWeight: 600, display: "block" }}>Deadline</span>
                      <span style={{ fontWeight: 700, color: C.text }}>{scheme.deadline ? new Date(scheme.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Rolling"}</span>
                    </div>
                    <div>
                      <span style={{ color: C.dim, fontWeight: 600, display: "block" }}>Documents</span>
                      <span style={{ fontWeight: 600, color: C.text }}>{scheme.requiredDocuments.length} required</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button type="button" onClick={() => setSelectedScheme(scheme)} style={{ padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: `1px solid ${C.border}`, background: C.green50, color: C.green800, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      View Details
                    </button>
                    <button type="button" onClick={() => askAgentAboutScheme(scheme)} style={{ padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: `1px solid ${C.green400}`, background: C.surface, color: C.green800, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Ask Agent
                    </button>
                    <button type="button" onClick={() => prepareApplication(scheme)} disabled={!isEligibleMatch} style={{ padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: "none", background: isEligibleMatch ? C.green800 : C.green100, color: isEligibleMatch ? "#fff" : C.dim, fontSize: "0.78rem", fontWeight: 700, cursor: isEligibleMatch ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                      Prepare Application
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: C.muted }}>No schemes match your search.</div>
          )}
        </div>
      </div>

      {/* ── Detail Modal (shared) ─────────────────────────────────────── */}
      {selectedScheme && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(10,39,13,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setSelectedScheme(null)}
        >
          <div
            className="scheme-card"
            style={{ maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedScheme(null)}
              style={{ float: "right", background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: C.dim }}
            >
              <X size={18} />
            </button>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: C.dim }}>{selectedScheme.department}</span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: C.text, marginTop: 4, marginBottom: 16 }}>{selectedScheme.name}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: "0.875rem" }}>
              <div><strong style={{ color: C.green800 }}>Benefits:</strong> {selectedScheme.benefit}</div>
              <div><strong style={{ color: C.green800 }}>Eligibility:</strong> {selectedScheme.eligibility}</div>
              <div>
                <strong style={{ color: C.green800 }}>Required documents:</strong>
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>{selectedScheme.requiredDocuments.map((doc) => <li key={doc}>{doc}</li>)}</ul>
              </div>
              <div><strong style={{ color: C.green800 }}>Official source:</strong> <a href={selectedScheme.officialSource} target="_blank" rel="noopener noreferrer" style={{ color: C.green700 }}>{selectedScheme.officialSource}</a></div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" onClick={() => { askAgentAboutScheme(selectedScheme); setSelectedScheme(null); }} style={{ padding: "0.625rem 1rem", borderRadius: "0.625rem", border: `1px solid ${C.border}`, background: C.green50, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Ask Agent</button>
              <button type="button" onClick={() => { prepareApplication(selectedScheme); setSelectedScheme(null); }} style={{ padding: "0.625rem 1rem", borderRadius: "0.625rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Prepare Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
