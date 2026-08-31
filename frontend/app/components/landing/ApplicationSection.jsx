"use client";

const applicationSteps = [
  { label: "Profile", done: true },
  { label: "Documents", done: true },
  { label: "Application", done: true },
  { label: "Review", done: false },
  { label: "OTP 🔒", done: false },
];

const documents = [
  { name: "Income Certificate", status: "Valid", badge: "Expires: 24 days", color: "#2E7D32", bg: "#F3EFE9" },
  { name: "Caste Certificate", status: "Verified", badge: "Verified", color: "#4CAF50", bg: "#F3EFE9" },
  { name: "Aadhaar", status: "Required", badge: "Required for identity verification", color: "#E07B39", bg: "#FFF3ED" },
];

export default function ApplicationSection() {
  return (
    <section
      id="phone-access"
      style={{
        padding: "7rem 2rem",
        background: "#061508",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
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
              lineHeight: 1.2,
              marginBottom: "1.25rem",
            }}
          >
            From finding an opportunity to taking the next step.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.65,
              maxWidth: "640px",
              margin: "0 auto 1rem",
            }}
          >
            Iva can help organize your application information, identify required documents, keep track of expiry dates, and prepare the repetitive parts of the process.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.65,
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            When something requires you — such as OTP, CAPTCHA, identity verification, or final submission — Iva stops and hands control back to you.
          </p>
        </div>

        {/* Content grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}
          className="app-grid"
        >
          {/* Application progress card */}
          <div
            style={{
              background: "#0b1a0e",
              border: "1px solid rgba(165, 214, 167, 0.15)",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid rgba(165, 214, 167, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#061508",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50" }} />
              <span
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "#A5D6A7",
                }}
              >
                Application Progress
              </span>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {applicationSteps.map((step, i) => (
                  <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: step.done ? "#2E7D32" : "rgba(255, 255, 255, 0.05)",
                        border: `1.5px solid ${step.done ? "#2E7D32" : "rgba(165, 214, 167, 0.2)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {step.done && <span style={{ color: "#fff", fontSize: "0.625rem", fontWeight: 700 }}>✓</span>}
                    </div>
                    <span
                      style={{
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        fontSize: "0.875rem",
                        color: step.done ? "#E8F5E9" : "#A5D6A7",
                        fontWeight: step.done ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontSize: "0.8125rem",
                  color: "#D5CDC0",
                  marginTop: "1.25rem",
                  fontStyle: "italic",
                }}
              >
                The agent has prepared the application. You complete identity verification.
              </p>
            </div>
          </div>

          {/* Documents card */}
          <div
            style={{
              background: "#0b1a0e",
              border: "1px solid rgba(165, 214, 167, 0.15)",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid rgba(165, 214, 167, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#061508",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50" }} />
              <span
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "#A5D6A7",
                }}
              >
                Your Documents
              </span>
            </div>
            <div style={{ padding: "0.5rem 0" }}>
              {documents.map((doc, i) => (
                <div
                  key={doc.name}
                  style={{
                    padding: "0.875rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < documents.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "#E8F5E9",
                        marginBottom: "3px",
                      }}
                    >
                      {doc.name}
                    </p>
                    <p
                      style={{
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        fontWeight: 400,
                        fontSize: "0.75rem",
                        color: "#A5D6A7",
                      }}
                    >
                      {doc.badge}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "#fff",
                      background: doc.color,
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phone access - compact secondary */}
        <div
          style={{
            marginTop: "3rem",
            padding: "2.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(165, 214, 167, 0.15)",
            background: "#0b1a0e",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
          className="phone-access-row"
        >
          {/* Phone icon */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#0c2210",
              border: "1px solid rgba(165, 214, 167, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8a2 2 0 012-2h2l2 5-2.5 1.5a12 12 0 005 5L14 14l5 2v2a2 2 0 01-2 2C9 18 5 13 5 6z" />
              <line x1="17" y1="8" x2="17" y2="13" />
              <line x1="20" y1="6" x2="20" y2="15" />
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontFamily: 'Syne, sans-serif',
                textTransform: "lowercase",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "#F3EFE9",
                marginBottom: "0.375rem",
              }}
            >
              No smartphone? You can still ask for help.
            </h3>
            <p
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 400,
                fontSize: "0.9375rem",
                color: "#A5D6A7",
                lineHeight: 1.6,
                maxWidth: "560px",
              }}
            >
              The agent is designed to extend beyond the screen. With phone-based access, users can ask about relevant schemes, hear updates, and understand what action is needed — without relying on a smartphone.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .app-grid { grid-template-columns: 1fr !important; }
          .phone-access-row { flex-direction: column !important; text-align: center; }
        }
      `}</style>
    </section>
  );
}
