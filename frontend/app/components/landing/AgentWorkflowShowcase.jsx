"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const STEP_DURATION = 7000; // 7s per step

const STEPS = [
  {
    id: "profile",
    number: "01",
    title: "Tell us about yourself",
    description:
      "Share your education level, income, category, and state once. Your agent uses this profile to match you with every scheme you're eligible for — no repeated form-filling.",
  },
  {
    id: "discover",
    number: "02",
    title: "Your agent finds opportunities",
    description:
      "It searches central and state databases, filters by your eligibility, and surfaces only schemes worth your attention — ranked by relevance and deadline.",
  },
  {
    id: "prepare",
    number: "03",
    title: "Your agent prepares the application",
    description:
      "Documents are pulled from your profile, forms are filled accurately, and everything is checked before submission. You review, then confirm.",
  },
  {
    id: "control",
    number: "04",
    title: "You stay in control",
    description:
      "Identity verification and final submission always require your confirmation. Your agent never acts on your behalf without an explicit go-ahead from you.",
  },
  {
    id: "track",
    number: "05",
    title: "Your agent keeps watching",
    description:
      "After submission, your agent monitors the status, alerts you to any required actions, and keeps a record of every application — so you don't have to check portals manually.",
  },
];

// ─── Visual Panels ──────────────────────────────────────────────────────────

function ProfileVisual() {
  const fields = ["State", "Category", "Annual Income", "Education Level", "Aadhaar Verified"];
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Your Profile</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginTop: "1rem" }}>
        {fields.map((f, i) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4B7A5E",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                height: "10px",
                borderRadius: "4px",
                background: "#E4DDCF",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  background: "#4B7A5E",
                  borderRadius: "4px",
                  width: `${55 + i * 8}%`,
                  opacity: 0.7,
                }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "#8C816C", whiteSpace: "nowrap", minWidth: "80px", fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscoverVisual() {
  const schemes = [
    { name: "PM YASASVI Scholarship", match: 97 },
    { name: "Post-Matric Scholarship", match: 94 },
    { name: "National Merit Scholarship", match: 88 },
    { name: "State Education Board Grant", match: 81 },
  ];
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Matching schemes…</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginTop: "1rem" }}>
        {schemes.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F1EDE4",
              borderRadius: "0.5rem",
              padding: "0.625rem 0.875rem",
              border: "1px solid #E4DDCF",
            }}
          >
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#232B45", fontWeight: 500 }}>{s.name}</span>
            <span
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#4B7A5E",
                background: "#E8F2ED",
                padding: "2px 8px",
                borderRadius: "9999px",
              }}
            >
              {s.match}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrepareVisual() {
  const docs = ["Aadhaar Card", "Income Certificate", "Marksheet (Class X)", "Bank Passbook", "Category Certificate"];
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Preparing application</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
        {docs.map((doc, i) => (
          <div
            key={doc}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#4B7A5E" strokeWidth="1.25" />
              <polyline points="5,8 7,10 11,6" stroke="#4B7A5E" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#333D5C" }}>{doc}</span>
          </div>
        ))}
        <div style={{ marginTop: "0.75rem", background: "#C6841F", borderRadius: "0.5rem", padding: "0.5rem 1rem", textAlign: "center" }}>
          <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600, fontSize: "0.8125rem", color: "#fff" }}>Review &amp; Confirm →</span>
        </div>
      </div>
    </div>
  );
}

function ControlVisual() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Your confirmation required</p>
      <div
        style={{
          marginTop: "1.25rem",
          background: "#FCFAF6",
          border: "1.5px solid #A7AFC6",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔐</div>
        <p style={{ fontFamily: '"Times New Roman", Georgia, serif', fontWeight: 700, fontSize: "1rem", color: "#0B1220", marginBottom: "0.5rem" }}>
          Identity Verification
        </p>
        <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#4C577A", marginBottom: "1.25rem", lineHeight: 1.5 }}>
          Your agent has prepared everything. Enter your OTP to authorise submission.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} style={{ width: "32px", height: "40px", background: "#F1EDE4", border: "1px solid #CFC6B4", borderRadius: "6px" }} />
          ))}
        </div>
        <div
          style={{
            background: "#C6841F",
            color: "#fff",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: "0.875rem",
            padding: "0.6rem 1.5rem",
            borderRadius: "9999px",
            display: "inline-block",
          }}
        >
          Confirm &amp; Submit
        </div>
      </div>
    </div>
  );
}

function TrackVisual() {
  const events = [
    { status: "success", label: "Application submitted", time: "2 days ago" },
    { status: "success", label: "Portal acknowledged receipt", time: "Yesterday" },
    { status: "pending", label: "Awaiting department review", time: "In progress" },
  ];
  const colors = { success: "#4B7A5E", pending: "#C6841F", attention: "#B4543D" };
  return (
    <div style={{ padding: "1.5rem" }}>
      <p style={visualLabelStyle}>Application status</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginTop: "1rem" }}>
        {events.map((ev, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: colors[ev.status],
                flexShrink: 0,
                marginTop: "3px",
              }}
            />
            <div>
              <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.875rem", fontWeight: 500, color: "#0B1220", marginBottom: "2px" }}>{ev.label}</p>
              <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.75rem", color: "#8C816C" }}>{ev.time}</p>
            </div>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #E4DDCF", paddingTop: "0.875rem", marginTop: "0.25rem" }}>
          <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#8C816C", fontStyle: "italic" }}>
            Your agent is watching. You'll be notified of any updates.
          </p>
        </div>
      </div>
    </div>
  );
}

const VISUALS = [ProfileVisual, DiscoverVisual, PrepareVisual, ControlVisual, TrackVisual];

const visualLabelStyle = {
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontWeight: 500,
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#8C816C",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentWorkflowShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [key, setKey] = useState(0); // forces progress bar remount
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
    // Resume after 12s
    setTimeout(() => setPaused(false), 12000);
  };

  const Visual = VISUALS[active];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "6rem 2rem",
        background: "#F1EDE4",
        borderTop: "1px solid #E4DDCF",
        borderBottom: "1px solid #E4DDCF",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 500, fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C6841F", marginBottom: "0.75rem" }}>
            How your agent works
          </p>
          <h2 style={{ fontFamily: '"Times New Roman", Georgia, serif', fontWeight: 700, fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", color: "#0B1220", letterSpacing: "-0.02em" }}>
            Five steps. Your agent handles most of them.
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
                    borderBottom: "1px solid #E4DDCF",
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  {/* Progress underline */}
                  {isActive && (
                    <div
                      className="progress-bar-active"
                      key={key}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        height: "2px",
                        background: "#C6841F",
                        "--progress-duration": `${STEP_DURATION}ms`,
                      }}
                    />
                  )}

                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    {/* Number */}
                    <span
                      style={{
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: isActive ? "#C6841F" : "#B0A48D",
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
                      {/* Title */}
                      <p
                        style={{
                          fontFamily: '"Times New Roman", Georgia, serif',
                          fontWeight: 700,
                          fontSize: "1.0625rem",
                          color: isActive ? "#0B1220" : "#4C577A",
                          marginBottom: isActive ? "0.5rem" : "0",
                          transition: "color 0.2s",
                          lineHeight: 1.3,
                        }}
                      >
                        {step.title}
                      </p>
                      {/* Description — only when active */}
                      <p
                        style={{
                          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                          fontWeight: 400,
                          fontSize: "0.9375rem",
                          color: "#4C577A",
                          lineHeight: 1.6,
                          maxHeight: isActive ? "6rem" : "0",
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
              background: "#FCFAF6",
              border: "1px solid #E4DDCF",
              borderRadius: "1rem",
              minHeight: "320px",
              boxShadow: "0 12px 24px -6px rgba(11,18,32,0.10)",
              overflow: "hidden",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #F1EDE4",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {[0, 1, 2].map(n => (
                <div key={n} style={{ width: "10px", height: "10px", borderRadius: "50%", background: n === 0 ? "#F0A83C" : n === 1 ? "#4B7A5E" : "#D3D7E3" }} />
              ))}
              <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.75rem", color: "#8C816C", marginLeft: "0.5rem" }}>
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

      {/* Mobile stack override */}
      <style>{`
        @media (max-width: 768px) {
          .showcase-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
