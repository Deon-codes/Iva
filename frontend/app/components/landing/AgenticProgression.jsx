"use client";

export default function AgenticProgression() {
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
          maxWidth: "1080px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: "5rem",
          alignItems: "center",
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
            You don&apos;t need to know the name of a scheme.
          </p>
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
            Just tell Iva about yourself, what you&apos;re looking for, or what you need help with.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#D5CDC0",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Your agent understands your situation, finds relevant opportunities, and explains what matters.
          </p>
        </div>

        {/* Right: convo.gif — scaled down to fit naturally */}
        <div
          style={{
            maxHeight: "550px",
          }}
          className="convo-gif-container"
        >
          <img
            src="/convo.gif"
            alt="Conversational experience with Iva agent — describe your situation and find relevant schemes"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain",
              maxHeight: "550px",
            }}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .intro-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .convo-gif-container {
            order: -1;
            max-height: 320px;
          }
          .convo-gif-container img {
            max-height: 320px;
          }
        }
      `}</style>
    </section>
  );
}
