"use client";
import { useState } from "react";

const CAPABILITIES = [
  {
    id: "discovery",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <line x1="18.5" y1="18.5" x2="24" y2="24" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="12" y1="9" x2="12" y2="15" />
      </svg>
    ),
    title: "Scheme Discovery",
    description:
      "Your agent searches thousands of central and state schemes based on your profile — income, category, education stage, and location.",
  },
  {
    id: "preparation",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="16" height="20" rx="2" />
        <line x1="9" y1="9" x2="19" y2="9" />
        <line x1="9" y1="13" x2="19" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
        <path d="M17 18l2 2 4-4" />
      </svg>
    ),
    title: "Application Preparation",
    description:
      "Forms, supporting documents, and declarations — prepared accurately and completely using your verified profile data.",
  },
  {
    id: "legitimacy",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3L5 7v6c0 5.25 3.92 10.15 9 11.35C19.08 23.15 23 18.25 23 13V7L14 3z" />
        <polyline points="10 13 13 16 18 11" />
      </svg>
    ),
    title: "Legitimacy Checks",
    description:
      "Every scheme is cross-referenced against official government portals before your agent takes any action.",
  },
  {
    id: "tracking",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 01.93 11.9M18 8v4l2 2" />
        <path d="M4 12a10 10 0 1016 8" />
        <circle cx="4" cy="12" r="2" />
        <line x1="8" y1="12" x2="4" y2="12" />
      </svg>
    ),
    title: "Status Tracking",
    description:
      "Your agent keeps watching after submission — checking for status updates, deadline changes, and required actions.",
  },
];

// Dot-grid background SVG
function DotGrid({ color = "#D3D7E3" }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={`dot-${color.replace("#", "")}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dot-${color.replace("#", "")})`} />
    </svg>
  );
}

export default function CapabilityStrip() {
  const [hovered, setHovered] = useState(null);

  return (
    <section
      id="features"
      style={{
        padding: "6rem 2rem",
        background: "#FAF8F4",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={eyebrowStyle}>What your agent can do</p>
          <h2 style={sectionHeadingStyle}>Four things your agent handles for you</h2>
        </div>

        {/* Card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {CAPABILITIES.map((cap) => {
            const isHovered = hovered === cap.id;
            return (
              <div
                key={cap.id}
                onMouseEnter={() => setHovered(cap.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: isHovered ? "#FCFAF6" : "#F1EDE4",
                  border: `1px solid ${isHovered ? "#A7AFC6" : "#E4DDCF"}`,
                  borderRadius: "0.75rem",
                  padding: "2rem 1.75rem",
                  transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
                  boxShadow: isHovered ? "0 8px 24px -6px rgba(11,18,32,0.12)" : "0 1px 2px 0 rgba(11,18,32,0.04)",
                  transform: isHovered ? "translateY(-3px)" : "none",
                  cursor: "default",
                }}
              >
                {/* Dot grid background */}
                <div style={{ position: "absolute", inset: 0, opacity: isHovered ? 0.6 : 0.3, transition: "opacity 0.25s ease" }}>
                  <DotGrid color="#CFC6B4" />
                </div>

                {/* Content */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      color: "#C6841F",
                      marginBottom: "1.25rem",
                      transition: "transform 0.25s ease",
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    {cap.icon}
                  </div>

                  <h3
                    style={{
                      fontFamily: '"Times New Roman", Georgia, serif',
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      color: "#0B1220",
                      marginBottom: "0.75rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {cap.title}
                  </h3>

                  <p
                    style={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 400,
                      fontSize: "0.9375rem",
                      color: "#4C577A",
                      lineHeight: 1.6,
                    }}
                  >
                    {cap.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const eyebrowStyle = {
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontWeight: 500,
  fontSize: "0.8125rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#C6841F",
  marginBottom: "0.75rem",
};

const sectionHeadingStyle = {
  fontFamily: '"Times New Roman", Georgia, serif',
  fontWeight: 700,
  fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
  color: "#0B1220",
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
};
