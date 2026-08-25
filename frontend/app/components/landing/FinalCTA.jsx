"use client";
export default function FinalCTA() {
  return (
    <section
      id="get-started-final"
      style={{
        padding: "9rem 2rem",
        background: "#0B1220",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Serif headline */}
        <h2
          style={{
            fontFamily: '"Times New Roman", Georgia, serif',
            fontWeight: 700,
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            color: "#FAF8F4",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            marginBottom: "1.5rem",
          }}
        >
          Your next opportunity shouldn't be lost in paperwork.
        </h2>

        {/* Sub-line */}
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: "1.0625rem",
            color: "#8C816C",
            lineHeight: 1.65,
            marginBottom: "2.5rem",
          }}
        >
          Create your profile. Let your agent take it from there.
        </p>

        {/* CTA */}
        <a
          href="/signup"
          style={{
            display: "inline-block",
            background: "#C6841F",
            color: "#fff",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: "1rem",
            padding: "1rem 2.5rem",
            borderRadius: "9999px",
            textDecoration: "none",
            boxShadow: "0 4px 24px -4px rgba(198,132,31,0.5)",
            transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#A66A16";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#C6841F";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Get Started
        </a>

        {/* Trust micro-signal */}
        <p
          style={{
            marginTop: "2rem",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: "0.8125rem",
            color: "#635A49",
          }}
        >
          Free to use &nbsp;·&nbsp; No hidden charges &nbsp;·&nbsp; Your data stays private
        </p>
      </div>
    </section>
  );
}
