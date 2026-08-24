"use client";
export default function Footer() {
  const links = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Privacy", href: "#" },
    { label: "Contact", href: "#" },
  ];

  return (
    <footer
      style={{
        background: "#0F1322",
        padding: "3rem 2rem",
        borderTop: "1px solid #161B2E",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        {/* Wordmark */}
        <div>
          <span
            style={{
              fontFamily: '"Times New Roman", Georgia, serif',
              fontWeight: 700,
              fontSize: "1.375rem",
              color: "#ECEEF3",
              letterSpacing: "-0.02em",
            }}
          >
            hazela
          </span>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "0.8125rem",
              color: "#4C577A",
              marginTop: "0.35rem",
            }}
          >
            Agentic government schemes &amp; scholarships
          </p>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          {links.map(link => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 400,
                fontSize: "0.875rem",
                color: "#4C577A",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#A7AFC6")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4C577A")}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Bottom line */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid #161B2E",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#333D5C" }}>
          © 2025 Hazela. All rights reserved.
        </p>
        <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#333D5C" }}>
          Verifies schemes against official government portals only.
        </p>
      </div>
    </footer>
  );
}
