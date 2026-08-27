"use client";

export default function DocumentsSection() {
  const docs = [
    { name: "Income Certificate", status: "Valid", badge: "Expires: 24 days", color: "#2E7D32", bg: "#F3EFE9" },
    { name: "Caste Certificate", status: "Verified", badge: "Verified", color: "#4CAF50", bg: "#F3EFE9" },
    { name: "Aadhaar", status: "Required", badge: "Required for identity verification", color: "#E07B39", bg: "#FFF3ED" },
  ];

  return (
    <section
      style={{
        padding: "7rem 2rem",
        background: "#F3EFE9",
        borderTop: "1px solid #E5DFD5",
        borderBottom: "1px solid #E5DFD5",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
        className="docs-grid"
      >
        {/* Left: Document cards */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5DFD5",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 4px 10px -2px rgba(10,39,13,0.08)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #E5DFD5",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#FAFAF8",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4CAF50" }} />
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600, fontSize: "0.8125rem", color: "#1B5E20" }}>
              Your Documents
            </span>
          </div>

          {/* Doc list */}
          <div style={{ padding: "0.5rem 0" }}>
            {docs.map((doc, i) => (
              <div
                key={doc.name}
                style={{
                  padding: "0.875rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: i < docs.length - 1 ? "1px solid #F3EFE9" : "none",
                  gap: "1rem",
                }}
              >
                <div>
                  <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600, fontSize: "0.875rem", color: "#061508", marginBottom: "3px" }}>
                    {doc.name}
                  </p>
                  <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 400, fontSize: "0.75rem", color: "#2A3B2D" }}>
                    {doc.badge}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: doc.color,
                    background: doc.bg,
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

        {/* Right: Text */}
        <div>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "clamp(1.625rem, 3vw, 2.25rem)",
              color: "#061508",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.25rem",
            }}
          >
            Your documents, ready when you need them.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#2A3B2D",
              lineHeight: 1.65,
            }}
          >
            Keep the documents required for your applications organized in one place. Your agent can identify which documents are needed, what's missing, and when something may need to be renewed.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .docs-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
      `}</style>
    </section>
  );
}
