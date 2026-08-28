"use client";
import { useState } from "react";

export default function Footer() {
  const [bloubState, setBloubState] = useState("neutral");

  const leftLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "What you can do", href: "#what-you-can-do" },
  ];

  const rightLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ];

  return (
    <footer
      style={{
        background: "#061508",
        padding: "5rem 2rem 2rem",
        borderTop: "1px solid rgba(165, 214, 167, 0.15)",
        position: "relative",
        marginTop: "6rem",
        borderRadius: "2.5rem 2.5rem 0 0",
      }}
    >
      {/* Centered Bloub Logo Overlapping the Top Edge */}
      <div
        style={{
          position: "absolute",
          top: "-36px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "72px",
          height: "72px",
          background: "#F3EFE9",
          borderRadius: "50%",
          border: "3px solid #061508",
          boxShadow: "0 4px 16px rgba(10,39,13,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 0.3s ease, background-color 0.3s ease",
          transform: bloubState === "excited" ? "translateX(-50%) scale(1.08) translateY(-2px)" : "translateX(-50%) scale(1)",
          zIndex: 10,
        }}
        onMouseEnter={() => setBloubState("excited")}
        onMouseLeave={() => setBloubState("neutral")}
        onClick={() => {
          const element = document.querySelector("#hero");
          if (element) element.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <img
          src={`/bloub-${bloubState}.svg`}
          alt="Hazela Bloub"
          style={{
            width: "44px",
            height: "44px",
            objectFit: "contain",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.2fr 1.5fr 1.2fr",
          gap: "3rem",
          alignItems: "start",
          paddingBottom: "3.5rem",
        }}
        className="footer-grid"
      >
        {/* Left Side: Contact / About Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={sectionHeaderStyle}>Platform</h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {leftLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F3EFE9")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4CAF50")}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Center: Hazela Wordmark + Tagline + Actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "2.25rem",
              color: "#F3EFE9",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "0.75rem",
            }}
          >
            Hazela
          </span>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "0.9375rem",
              color: "#4CAF50",
              lineHeight: 1.5,
              maxWidth: "280px",
              marginBottom: "1.75rem",
            }}
          >
            Your personal agent for government schemes and scholarships.
          </p>

          {/* Quick Buttons */}
          <div style={{ display: "flex", gap: "0.875rem" }}>
            <a
              href="/signup"
              style={{
                background: "#2E7D32",
                color: "#fff",
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: "0.875rem",
                padding: "0.6rem 1.5rem",
                borderRadius: "9999px",
                textDecoration: "none",
                transition: "background 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2A3B2D";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2E7D32";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Get Started
            </a>
            <a
              href="/login"
              style={{
                border: "1.5px solid #2E7D32",
                color: "#D5CDC0",
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: "0.875rem",
                padding: "0.55rem 1.5rem",
                borderRadius: "9999px",
                textDecoration: "none",
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#D5CDC0";
                e.currentTarget.style.color = "#F3EFE9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2E7D32";
                e.currentTarget.style.color = "#D5CDC0";
              }}
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Right Side: Legal Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end" }} className="legal-col">
          <h4 style={sectionHeaderStyle}>Legal</h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.625rem", alignItems: "flex-end" }} className="legal-nav">
            {rightLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F3EFE9")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4CAF50")}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom section: copyright + disclaimer */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          paddingTop: "1.75rem",
          borderTop: "1px solid rgba(165, 214, 167, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#2E7D32" }}>
          © 2026 Hazela. All rights reserved.
        </p>
        <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.8125rem", color: "#2E7D32", maxWidth: "620px", lineHeight: 1.5 }} className="disclaimer-text">
          Hazela helps you discover, understand, prepare for, and track government schemes and scholarships. Eligibility and approval are ultimately determined by the relevant government department or scheme authority.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
            text-align: center;
          }
          .legal-col, .legal-nav {
            align-items: center !important;
          }
          .disclaimer-text {
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}

const sectionHeaderStyle = {
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontWeight: 600,
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#2E7D32",
};

const linkStyle = {
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontWeight: 500,
  fontSize: "0.875rem",
  color: "#4CAF50",
  textDecoration: "none",
  transition: "color 0.2s ease",
};