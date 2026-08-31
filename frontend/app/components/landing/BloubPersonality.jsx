"use client";

const states = [
  {
    id: "neutral",
    label: "Neutral",
    description: "Ready when you are.",
    detail: "The normal state when nothing requires attention.",
    svg: "/bloub-neutral.svg",
    animClass: "bloub-neutral",
  },
  {
    id: "attentive",
    label: "Attentive",
    description: "Listening closely.",
    detail: "Appears while the user is interacting or typing.",
    svg: "/bloub-attentive.svg",
    animClass: "bloub-attentive",
  },
  {
    id: "thinking",
    label: "Thinking",
    description: "Working on it.",
    detail: "Appears while Iva is processing a request.",
    svg: "/bloub-confused.svg",
    animClass: "bloub-confused",
  },
  {
    id: "excited",
    label: "Excited",
    description: "Found something promising.",
    detail: "Appears when a strong relevant match is discovered.",
    svg: "/bloub-excited.svg",
    animClass: "bloub-excited",
  },
  {
    id: "confused",
    label: "Confused",
    description: "I need a little more information.",
    detail: "Appears when the user's information is missing or ambiguous.",
    svg: "/bloub-suprised.svg",
    animClass: "bloub-surprised",
  },
  {
    id: "suspicious",
    label: "Suspicious",
    description: "Something needs checking.",
    detail: "Appears when a scheme or claim raises legitimacy concerns.",
    svg: "/bloub-suspicious.svg",
    animClass: "bloub-suspicious",
  },
];

export default function BloubPersonality() {
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
            An agent that reacts with you.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#2A3B2D",
              lineHeight: 1.65,
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            Iva doesn&apos;t just return results. Bloub reflects what&apos;s happening while your agent works.
          </p>
        </div>

        {/* States grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
          }}
          className="bloub-states-grid"
        >
          {states.map((state) => (
            <div
              key={state.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "2rem 1.5rem",
                borderRadius: "1rem",
                border: "1px solid #E5DFD5",
                background: "#fff",
              }}
            >
              {/* Bloub SVG — no card behind it, just the character */}
              <img
                src={state.svg}
                alt={`Bloub ${state.label}`}
                className={`bloub ${state.animClass}`}
                style={{
                  width: "64px",
                  height: "64px",
                  objectFit: "contain",
                  marginBottom: "1.25rem",
                  filter: "drop-shadow(0 4px 10px rgba(76, 175, 80, 0.2))",
                }}
              />
              <p
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#061508",
                  marginBottom: "0.375rem",
                  textTransform: "lowercase",
                }}
              >
                {state.label}
              </p>
              <p
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "#2E7D32",
                  marginBottom: "0.375rem",
                }}
              >
                {state.description}
              </p>
              <p
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: "0.8125rem",
                  color: "#2A3B2D",
                  lineHeight: 1.5,
                }}
              >
                {state.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .bloub-states-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .bloub-states-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
