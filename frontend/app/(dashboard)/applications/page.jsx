"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";

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
  completed: { color: C.green700, bg: C.green50, border: C.border, icon: "✓" },
  attention: { color: "#C62828", bg: "#FFEBEE", border: "#FFCDD2", icon: "⚠" },
  in_progress: { color: "#E08E00", bg: "#FFF8E1", border: "#FFE082", icon: "●" },
  locked: { color: C.dim, bg: C.green50, border: C.border, icon: "🔒" },
  pending: { color: C.muted, bg: C.surface, border: C.border, icon: "○" },
};

export default function ApplicationsPage() {
  const { applications, schemes, askAgentAboutApplication, updateApplication, setPendingPrompt } = useApp();
  const [otpInput, setOtpInput] = useState("");
  const [otpModalApp, setOtpModalApp] = useState(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const pendingCount = applications.filter((a) =>
    ["Action Required", "Preparing Application"].includes(a.status)
  ).length;

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
        reason: "OTP verification completed. Form successfully submitted to official portal. Reference ID: #NSP-998127.",
        workflow: {
          profile: "completed",
          eligibility: "completed",
          documents: "completed",
          application: "completed",
          review: "completed",
          otp: "completed",
        },
        history: [
          ...otpModalApp.history,
          { event: "OTP consent verified", status: "success", timestamp: "Just now" },
          { event: "Submitted to official portal", status: "success", timestamp: "Just now" },
        ],
      });

      setIsVerifyingOtp(false);
      setOtpModalApp(null);
      setOtpInput("");
      setPendingPrompt("Check Central Sector submission status");
    }, 1500);
  };

  return (
    <div style={{ minHeight: "100%", background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "1.25rem" }}>

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
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: C.green800 }}>Application Workspace</h1>
          <p style={{ fontSize: "0.9rem", color: C.muted, marginTop: 6 }}>
            Track what your agent prepared, what needs your review, and where OTP verification is required.
          </p>
        </div>

        {applications.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "3rem", textAlign: "center" }}>
            <span style={{ fontSize: "2.5rem" }}>📁</span>
            <h3 style={{ fontWeight: 700, color: C.green800, marginTop: 12 }}>No applications yet</h3>
            <p style={{ fontSize: "0.875rem", color: C.muted, marginTop: 6 }}>Explore matching schemes and delegate preparation to your agent.</p>
            <Link href="/explore" style={{ display: "inline-block", marginTop: 20, padding: "0.625rem 1.25rem", background: C.green800, color: "#fff", borderRadius: 9999, fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
              Explore Schemes
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {applications.map((app) => {
              const hasAttention = Object.values(app.workflow).includes("attention");
              const canReview = app.workflow.review === "attention" || app.workflow.review === "in_progress";
              const isDisbursed = app.status.includes("Disbursed");
              const accent = hasAttention ? "#C62828" : isDisbursed ? C.green700 : "#E08E00";

              return (
                <div key={app.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, borderRadius: "1rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: "1 1 280px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text }}>{app.name}</h3>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", padding: "3px 8px", borderRadius: 9999, background: hasAttention ? "#FFEBEE" : C.green50, color: accent, border: `1px solid ${hasAttention ? "#FFCDD2" : C.border}` }}>
                          {app.status}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: C.muted, marginTop: 10, padding: "0.75rem", background: C.green50, borderRadius: "0.625rem", lineHeight: 1.5 }}>
                        <strong>Current phase:</strong> {app.reason}
                      </p>
                      <span style={{ fontSize: "0.68rem", color: C.dim, display: "block", marginTop: 8 }}>Last action: {app.updatedAt}</span>
                      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <button type="button" onClick={() => askAgentAboutApplication(app)} style={{ padding: "0.5rem 1rem", borderRadius: "0.625rem", border: "none", background: hasAttention ? "#C62828" : C.green50, color: hasAttention ? "#fff" : C.green800, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>
                          {hasAttention ? "Ask Agent What Happened" : "Ask Agent status review"}
                        </button>
                        {canReview && (
                          <button type="button" onClick={() => setOtpModalApp(app)} style={{ padding: "0.5rem 1rem", borderRadius: "0.625rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>
                            Provide OTP Consent
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: "0 1 260px", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.dim, marginBottom: 12 }}>Agent pipeline</div>
                      {[
                        { label: "Profile verified", key: "profile" },
                        { label: "Eligibility verified", key: "eligibility" },
                        { label: "Documents matched", key: "documents" },
                        { label: "Application compiled", key: "application" },
                        { label: "User review completed", key: "review" },
                        { label: "Identity OTP submitted", key: "otp" },
                      ].map(({ label, key }) => {
                        const state = app.workflow[key] || "pending";
                        const style = stepStyles[state] || stepStyles.pending;
                        return (
                          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, fontSize: "0.78rem" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${style.border}`, background: style.bg, color: style.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>{style.icon}</span>
                              <span style={{ color: state === "completed" ? C.dim : C.text, textDecoration: state === "completed" ? "line-through" : "none" }}>{label}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {otpModalApp && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,39,13,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "1rem", padding: "1.5rem", maxWidth: 400, width: "100%" }}>
            <button type="button" onClick={() => setOtpModalApp(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: C.dim }}>✕</button>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#C62828", textTransform: "uppercase" }}>Identity verification</span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text, marginTop: 4 }}>OTP consent required</h3>
            <p style={{ fontSize: "0.82rem", color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              Your agent compiled the form for <strong>{otpModalApp.name}</strong>. Government portals require your manual OTP to submit.
            </p>
            <div style={{ marginTop: 12, padding: "0.75rem", background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: "0.625rem", fontSize: "0.78rem", color: "#5D4037" }}>
              Demo bypass code: <strong>123456</strong>
            </div>
            <form onSubmit={handleOtpSubmit} style={{ marginTop: 16 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text }}>Enter 6-digit OTP</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 6, padding: "0.75rem", border: `1px solid ${C.border}`, borderRadius: "0.625rem", textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.2em", fontFamily: "monospace" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="button" onClick={() => setOtpModalApp(null)} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.625rem", border: `1px solid ${C.border}`, background: C.green50, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button type="submit" disabled={isVerifyingOtp} style={{ flex: 1, padding: "0.625rem", borderRadius: "0.625rem", border: "none", background: C.green800, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {isVerifyingOtp ? "Verifying…" : "Verify & Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
