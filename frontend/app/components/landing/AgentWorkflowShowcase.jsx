"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const STEP_DURATION = 7000;

const STEPS = [
  {
    id: "tell",
    number: "01",
    title: "Tell your agent what you're looking for.",
    description:
      "Share your situation, goals, or what you need help with. You don't have to know the name of a scheme beforehand.",
  },
  {
    id: "discover",
    number: "02",
    title: "Your agent finds opportunities for you.",
    description:
      "It compares your profile against relevant government schemes and scholarships instead of making you search through them one by one.",
  },
  {
    id: "verify",
    number: "03",
    title: "Know what's real before you act.",
    description:
      "Your agent checks the scheme against official sources and highlights legitimacy concerns before you proceed. No guessing. No suspicious links. No blindly trusting forwarded messages.",
  },
  {
    id: "apply",
    number: "04",
    title: "Let the agent do the preparation.",
    description:
      "It can help organize your information, check required documents, and prepare the application. When identity verification or OTP is required, you take over.",
  },
  {
    id: "track",
    number: "05",
    title: "You shouldn't have to keep checking.",
    description:
      "Your agent keeps the application context organized and surfaces important updates, missing documents, deadlines, and actions that need your attention.",
  },
];

// ─── Visual Panels ──────────────────────────────────────────────────────────

function TellVisual() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Your situation</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginTop: "1rem" }}>
        {["Maharashtra", "College student", "Family income ₹3L", "OBC category", "First year B.Tech"].map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50", flexShrink: 0 }} />
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.875rem", color: "#E8F5E9" }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1.25rem", background: "#2E7D32", borderRadius: "0.5rem", padding: "0.625rem 1rem", textAlign: "center" }}>
        <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600, fontSize: "0.8125rem", color: "#fff" }}>Tell your agent →</span>
      </div>
    </div>
  );
}

function DiscoverVisual() {
  const schemes = [
    { name: "AICTE Pragati Scholarship", match: 97 },
    { name: "Post-Matric Scholarship", match: 94 },
    { name: "Rajarshi Shahu Maharaj Merit", match: 88 },
    { name: "State Education Board Grant", match: 79 },
  ];
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Matching schemes…</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginTop: "1rem" }}>
        {schemes.map((s) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#061508",
              borderRadius: "0.5rem",
              padding: "0.625rem 0.875rem",
              border: "1px solid rgba(165, 214, 167, 0.15)",
            }}
          >
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#E8F5E9", fontWeight: 500 }}>{s.name}</span>
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.75rem", fontWeight: 700, color: "#A5D6A7", background: "rgba(46, 125, 50, 0.3)", padding: "2px 8px", borderRadius: "9999px" }}>
              {s.match}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifyVisual() {
  const checks = [
    { label: "Official source verified", ok: true },
    { label: "Eligibility information cross-checked", ok: true },
    { label: "No suspicious claims detected", ok: true },
    { label: "Scheme active — applications open", ok: true },
  ];
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Legitimacy check</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#4CAF50" strokeWidth="1.25" />
              <polyline points="5,8 7,10 11,6" stroke="#4CAF50" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#E8F5E9" }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyVisual() {
  const steps = ["Profile", "Documents", "Application", "Review", "OTP 🔒"];
  const done = [true, true, true, false, false];
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Application progress</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: done[i] ? "#2E7D32" : "rgba(255, 255, 255, 0.05)", border: `1px solid ${done[i] ? "#2E7D32" : "rgba(165, 214, 167, 0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {done[i] && <span style={{ color: "#fff", fontSize: "0.625rem", fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.875rem", color: done[i] ? "#E8F5E9" : "#A5D6A7", fontWeight: done[i] ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#D5CDC0", marginTop: "1rem", fontStyle: "italic" }}>
        The agent has prepared the application. You complete identity verification.
      </p>
    </div>
  );
}

function TrackVisual() {
  const events = [
    { status: "success", label: "Application submitted", time: "2 days ago" },
    { status: "success", label: "Portal acknowledged receipt", time: "Yesterday" },
    { status: "attention", label: "Action required", time: "Upload income certificate" },
  ];
  const colors = { success: "#4CAF50", pending: "#A5D6A7", attention: "#E07B39" };
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Application status</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginTop: "1rem" }}>
        {events.map((ev, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[ev.status], flexShrink: 0, marginTop: "3px" }} />
            <div>
              <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.875rem", fontWeight: 600, color: "#E8F5E9", marginBottom: "2px" }}>{ev.label}</p>
              <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.75rem", color: "#A5D6A7" }}>{ev.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = [TellVisual, DiscoverVisual, VerifyVisual, ApplyVisual, TrackVisual];

const visualLabelStyle = {
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontWeight: 600,
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#A5D6A7",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentWorkflowShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [key, setKey] = useState(0);
  const timerRef = useRef(null);

  const advance = useCallback(() => {
    setActive(prev => (prev + 1) % STEPS.length);
    setKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(advance, STEP_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [active, paused, advance]);

  const handleStepClick = (i) => {
    clearTimeout(timerRef.current);
    setActive(i);
    setKey(k => k + 1);
    setPaused(true);
    setTimeout(() => setPaused(false), 12000);
  };

  const Visual = VISUALS[active];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "6rem 2rem",
        background: "#061508",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "#F3EFE9",
              letterSpacing: "-0.02em",
            }}
          >
            From "What can I get?" to "What's next?"
          </h2>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            alignItems: "start",
          }}
          className="showcase-grid"
        >
          {/* Left: Step tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {STEPS.map((step, i) => {
              const isActive = active === i;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(i)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    padding: "1.25rem 0",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  {isActive && (
                    <div
                      className="progress-bar-active"
                      key={key}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        height: "2px",
                        background: "#2E7D32",
                        "--progress-duration": `${STEP_DURATION}ms`,
                      }}
                    />
                  )}

                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: isActive ? "#2E7D32" : "#D5CDC0",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: "3px",
                        minWidth: "24px",
                        transition: "color 0.2s",
                      }}
                    >
                      {step.number}
                    </span>

                    <div>
                      <p
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          textTransform: "lowercase",
                          fontWeight: 700,
                          fontSize: "1.0625rem",
                          color: isActive ? "#fff" : "#D5CDC0",
                          marginBottom: isActive ? "0.5rem" : "0",
                          transition: "color 0.2s",
                          lineHeight: 1.3,
                        }}
                      >
                        {step.title}
                      </p>
                      <p
                        style={{
                          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                          fontWeight: 400,
                          fontSize: "0.9375rem",
                          color: "#A5D6A7",
                          lineHeight: 1.6,
                          maxHeight: isActive ? "8rem" : "0",
                          opacity: isActive ? 1 : 0,
                          overflow: "hidden",
                          transition: "max-height 0.35s ease, opacity 0.35s ease",
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Visual panel */}
          <div
            style={{
              position: "sticky",
              top: "6rem",
              background: "#0b1a0e",
              border: "1px solid rgba(165, 214, 167, 0.15)",
              borderRadius: "1rem",
              minHeight: "320px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(165, 214, 167, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#061508",
              }}
            >
              {[0, 1, 2].map(n => (
                <div key={n} style={{ width: "10px", height: "10px", borderRadius: "50%", background: n === 0 ? "#F0A83C" : n === 1 ? "#4CAF50" : "rgba(255, 255, 255, 0.1)" }} />
              ))}
              <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.75rem", color: "#A5D6A7", marginLeft: "0.5rem" }}>
                Step {STEPS[active].number} — {STEPS[active].title}
              </span>
            </div>

            {/* Visual */}
            <div key={`${active}-visual`} className="visual-panel-enter">
              <Visual />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .showcase-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
