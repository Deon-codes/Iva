"use client";

const problems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6" />
        <line x1="13.5" y1="13.5" x2="17" y2="17" />
      </svg>
    ),
    title: "Scattered information",
    body: "The right opportunity may be buried across different government portals and sources.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2" />
        <circle cx="10" cy="10" r="3" />
        <path d="M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
      </svg>
    ),
    title: "Confusing eligibility",
    body: "Requirements aren't always easy to understand or compare.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <line x1="7" y1="8" x2="13" y2="8" />
        <line x1="7" y1="12" x2="11" y2="12" />
      </svg>
    ),
    title: "Too much paperwork",
    body: "Documents, forms, deadlines, and requirements quickly become difficult to keep track of.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l2.5 5h5.5l-4.5 3.5 1.5 5.5L10 13l-5 3 1.5-5.5L2 7h5.5z" />
      </svg>
    ),
    title: "Hard to know what's real",
    body: "Forwarded messages and unofficial links can make legitimate opportunities difficult to distinguish from suspicious ones.",
  },
];

export default function ProblemSection() {
  return (
    <section
      style={{
        padding: "7rem 2rem",
        background: "#F3EFE9",
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
              color: "#061508",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.25rem",
            }}
          >
            Government schemes shouldn&apos;t be this hard to navigate.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#2A3B2D",
              lineHeight: 1.65,
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            There are opportunities scattered across different websites, complicated eligibility rules, unfamiliar requirements, and forms that take time to understand.
            Even after you apply, it can be difficult to know what happens next.
          </p>
        </div>

        {/* Problem grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2rem",
          }}
          className="problem-grid"
        >
          {problems.map((problem) => (
            <div
              key={problem.title}
              style={{
                padding: "1.75rem",
                borderRadius: "1rem",
                border: "1px solid #E5DFD5",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "0.75rem",
                  background: "#F3EFE9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                {problem.icon}
              </div>
              <h3
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#061508",
                  marginBottom: "0.5rem",
                  lineHeight: 1.3,
                }}
              >
                {problem.title}
              </h3>
              <p
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: "0.9375rem",
                  color: "#2A3B2D",
                  lineHeight: 1.6,
                }}
              >
                {problem.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .problem-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
