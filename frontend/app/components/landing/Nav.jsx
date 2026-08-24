"use client";
import { useState, useEffect } from "react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "background 0.3s ease, box-shadow 0.3s ease",
        background: scrolled ? "rgba(250,248,244,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 0 0 #D3D7E3" : "none",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Wordmark */}
        <a
          href="/"
          style={{
            fontFamily: '"Times New Roman", Georgia, serif',
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "#0B1220",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          hazela
        </a>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="#how-it-works" className="nav-link" style={navLinkStyle}>How it works</a>
          <a href="#features" className="nav-link" style={navLinkStyle}>Features</a>
          <a href="#trust" className="nav-link" style={navLinkStyle}>About</a>
          <a
            href="#get-started"
            style={{
              background: "#C6841F",
              color: "#fff",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "0.9375rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              textDecoration: "none",
              transition: "background 0.2s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => (e.target.style.background = "#A66A16")}
            onMouseLeave={e => (e.target.style.background = "#C6841F")}
          >
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}

const navLinkStyle = {
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontWeight: 500,
  fontSize: "0.9375rem",
  color: "#333D5C",
  textDecoration: "none",
  transition: "color 0.2s ease",
};
