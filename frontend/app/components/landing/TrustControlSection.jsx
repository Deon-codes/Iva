"use client";

export default function TrustControlSection() {
  const points = [
    "Official source verification",
    "Eligibility information cross-checked",
    "Suspicious claims highlighted",
    "Scam indicators surfaced",
    "No pretending that an unofficial source is government-approved",
  ];

  return (
    <section
      id="trust"
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
        className="trust-grid"
      >
        {/* Left: Text */}
        <div>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "clamp(1.625rem, 3vw, 2.25rem)",
              color: "#F3EFE9",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            Before you apply, know who you're dealing with.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.65,
              marginBottom: "1rem",
            }}
          >
            Government schemes are often shared through messages, social media posts, and forwarded links.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.65,
              marginBottom: "1.5rem",
            }}
          >
            Not every opportunity you see online is legitimate.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.65,
              marginBottom: "1.5rem",
            }}
          >
            Your agent checks scheme information against official sources and surfaces warning signs before you continue.
          </p>

          {/* Highlight box */}
          <div
            style={{
              background: "#0c2210",
              border: "1px solid rgba(165, 214, 167, 0.15)",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
            }}
          >
            <p
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: "0.9375rem",
                color: "#A5D6A7",
                lineHeight: 1.5,
              }}
            >
              If something looks suspicious, you'll know before you hand over your information.
            </p>
          </div>
        </div>

        {/* Right: Checklist */}
        <div>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#A5D6A7",
              marginBottom: "1.5rem",
            }}
          >
            What your agent checks
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {points.map((point, i) => (
              <div
                key={i}
                style={{
                  padding: "0.875rem 0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.875rem",
                  borderBottom: i < points.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#0c2210",
                    border: "1px solid rgba(165, 214, 167, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="2,5 4,7 8,3" stroke="#A5D6A7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    fontWeight: 400,
                    fontSize: "0.9375rem",
                    color: "#D5CDC0",
                    lineHeight: 1.5,
                  }}
                >
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .trust-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
        }
      `}</style>
    </section>
  );
}
