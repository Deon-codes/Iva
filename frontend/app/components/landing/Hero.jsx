"use client";
export default function Hero() {
  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "8rem 2rem 6rem",
        background: "#FAF8F4",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 60% 20%, rgba(198,132,31,0.06) 0%, transparent 55%), " +
            "radial-gradient(circle at 20% 80%, rgba(35,43,69,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: "760px" }}>
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: "0.8125rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#C6841F",
            marginBottom: "1.5rem",
          }}
        >
          Government Schemes &amp; Scholarships
        </p>

        {/* Display headline */}
        <h1
          style={{
            fontFamily: '"Times New Roman", Georgia, serif',
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 6vw, 3.75rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "#0B1220",
            marginBottom: "1.5rem",
          }}
        >
          Stop chasing scholarships.
          <br />
          <span style={{ color: "#333D5C" }}>Let your agent handle the paperwork.</span>
        </h1>

        {/* Supporting copy */}
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: "1.125rem",
            lineHeight: 1.65,
            color: "#4C577A",
            maxWidth: "520px",
            margin: "0 auto 2.5rem",
          }}
        >
          Hazela finds government schemes you qualify for, prepares your application,
          and keeps watching — so you never miss an opportunity.
        </p>

        {/* CTA row */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            id="get-started"
            href="#get-started-final"
            style={{
              display: "inline-block",
              background: "#C6841F",
              color: "#fff",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.875rem 2rem",
              borderRadius: "9999px",
              textDecoration: "none",
              boxShadow: "0 4px 14px -2px rgba(198,132,31,0.35)",
              transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#A66A16";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#C6841F";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started
          </a>
          <a
            href="#how-it-works"
            style={{
              display: "inline-block",
              background: "transparent",
              color: "#232B45",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.875rem 2rem",
              borderRadius: "9999px",
              textDecoration: "none",
              border: "1.5px solid #A7AFC6",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#333D5C";
              e.currentTarget.style.color = "#0B1220";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#A7AFC6";
              e.currentTarget.style.color = "#232B45";
            }}
          >
            See how it works
          </a>
        </div>

        {/* Trust micro-signal */}
        <p
          style={{
            marginTop: "2.5rem",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: "0.8125rem",
            color: "#8C816C",
            letterSpacing: "0.03em",
          }}
        >
          Checks against official government sources &nbsp;·&nbsp; No hidden fees
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          opacity: 0.4,
        }}
      >
        <div style={{ width: "1px", height: "40px", background: "#0B1220" }} />
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="#0B1220" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
