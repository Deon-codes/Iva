"use client";

export default function FinalCTA() {
  return (
    <section
      id="get-started-final"
      style={{
        padding: "8rem 2rem 6rem",
        background: "#F3EFE9",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: 'Syne, sans-serif',
            textTransform: "lowercase",
            fontWeight: 700,
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            color: "#061508",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            marginBottom: "1.5rem",
          }}
        >
          There&apos;s probably more you&apos;re eligible for than you know.
        </h2>

        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: "1.0625rem",
            color: "#2A3B2D",
            lineHeight: 1.65,
            marginBottom: "2.5rem",
          }}
        >
          Tell Iva about yourself and find out what you could apply for.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/signup"
            style={{
              display: "inline-block",
              background: "#2E7D32",
              color: "#fff",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "1rem",
              padding: "1rem 2.5rem",
              borderRadius: "9999px",
              textDecoration: "none",
              boxShadow: "0 4px 24px -4px rgba(46,125,50,0.5)",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#2A3B2D";
              e.currentTarget.style.transform = "translateY(-2px)";
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
              color: "#2A3B2D",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "1rem",
              padding: "1rem 2.5rem",
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
              e.currentTarget.style.color = "#2A3B2D";
            }}
          >
            Sign In
          </a>
        </div>

        {/* Supporting line */}
        <p
          style={{
            marginTop: "2rem",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: "0.875rem",
            color: "#2E7D32",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Find opportunities · Verify them · Apply with confidence · Keep track
        </p>
      </div>
    </section>
  );
}
