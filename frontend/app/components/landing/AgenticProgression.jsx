"use client";

export default function AgentIntroduction() {
  return (
    <section
      style={{
        padding: "7rem 2rem",
        background: "#061508",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5rem",
          alignItems: "start",
        }}
        className="intro-grid"
      >
        {/* Left: Text */}
        <div>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "#F3EFE9",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            One conversation. Everything you need.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.7,
              marginBottom: "1.25rem",
            }}
          >
            Government schemes and scholarships shouldn't require you to search through dozens of websites, understand complicated eligibility rules, and remember every deadline yourself.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.7,
              marginBottom: "0.75rem",
            }}
          >
            Just tell your agent about your situation.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.7,
            }}
          >
            It understands your profile, finds relevant opportunities, checks the details, and helps you take the next step.
          </p>
        </div>

        {/* Right: Chat preview */}
        <div
          style={{
            background: "#0b1a0e",
            border: "1px solid rgba(165, 214, 167, 0.15)",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Chat header bar */}
          <div
            style={{
              padding: "0.875rem 1.25rem",
              borderBottom: "1px solid rgba(165, 214, 167, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#061508",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4CAF50" }} />
            <span
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "#A5D6A7",
              }}
            >
              Hazela Agent
            </span>
          </div>

          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* User message */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  background: "#2E7D32",
                  color: "#fff",
                  borderRadius: "1rem 1rem 0 1rem",
                  padding: "0.75rem 1rem",
                  maxWidth: "85%",
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontSize: "0.875rem",
                  lineHeight: 1.55,
                }}
              >
                "I'm a college student from Maharashtra and my family income is below ₹3 lakh. What scholarships can I apply for?"
              </div>
            </div>

            {/* Agent response */}
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  background: "#061508",
                  border: "1px solid rgba(165, 214, 167, 0.15)",
                  borderRadius: "1rem 1rem 1rem 0",
                  padding: "0.875rem 1rem",
                  maxWidth: "90%",
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "#E8F5E9",
                }}
              >
                <p style={{ fontWeight: 700, marginBottom: "0.25rem", color: "#fff" }}>
                  I found 4 schemes that may be relevant to you.
                </p>
                <p style={{ color: "#A5D6A7", fontWeight: 600, marginBottom: "0.75rem" }}>
                  3 appear to match your profile.
                </p>
                <p style={{ color: "#D5CDC0", marginBottom: "0.75rem" }}>I'll show you:</p>
                {[
                  "Why you may be eligible",
                  "What you can receive",
                  "What documents you'll need",
                  "When applications close",
                  "Where the information comes from",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                    <span style={{ color: "#4CAF50", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    <span style={{ color: "#D5CDC0", fontSize: "0.8125rem" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .intro-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </section>
  );
}
