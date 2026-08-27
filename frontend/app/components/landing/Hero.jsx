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
        background: "#F3EFE9",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial gradient texture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 60% 20%, rgba(46,125,50,0.07) 0%, transparent 55%), " +
            "radial-gradient(circle at 20% 80%, rgba(10,39,13,0.05) 0%, transparent 50%)",
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
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#2E7D32",
            marginBottom: "1.5rem",
          }}
        >
          Your Personal Scheme Agent
        </p>

        {/* Display headline */}
        <h1
          style={{
            fontFamily: 'Syne, sans-serif',
            textTransform: "lowercase",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 6vw, 3.75rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "#061508",
            marginBottom: "1.5rem",
          }}
        >
          Stop searching.{" "}
          <span style={{ color: "#2E7D32" }}>Start getting things done.</span>
        </h1>

        {/* Supporting copy */}
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: "1.125rem",
            lineHeight: 1.65,
            color: "#2A3B2D",
            maxWidth: "560px",
            margin: "0 auto 2.5rem",
          }}
        >
          Tell us what you need, and your agent finds the government schemes and scholarships you may be eligible for, verifies where they came from, helps prepare your application, and keeps track of what happens next.
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
            href="/signup"
            style={{
              display: "inline-block",
              background: "#2E7D32",
              color: "#fff",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.875rem 2rem",
              borderRadius: "9999px",
              textDecoration: "none",
              boxShadow: "0 4px 14px -2px rgba(46,125,50,0.35)",
              transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#2A3B2D";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#2E7D32";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started
          </a>
          <a
            href="/login"
            style={{
              display: "inline-block",
              background: "transparent",
              color: "#061508",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "1rem",
              padding: "0.875rem 2rem",
              borderRadius: "9999px",
              textDecoration: "none",
              border: "1.5px solid #D5CDC0",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#2E7D32";
              e.currentTarget.style.color = "#061508";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#D5CDC0";
              e.currentTarget.style.color = "#061508";
            }}
          >
            Sign In
          </a>
        </div>

        {/* Small supporting line */}
        <p
          style={{
            marginTop: "2.5rem",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: "0.875rem",
            color: "#2E7D32",
            letterSpacing: "0.08em",
            fontWeight: 500,
          }}
        >
          Find → Verify → Apply → Track
        </p>
      </div>


    </section>
  );
}
