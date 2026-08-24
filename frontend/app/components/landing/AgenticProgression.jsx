"use client";
import { useEffect, useRef, useState } from "react";

const BEATS = [
  { id: "find",        label: "Find it.",        sub: "Discover every scheme you're eligible for." },
  { id: "understand",  label: "Understand it.",  sub: "Plain-language summaries of what each scheme offers." },
  { id: "prepare",     label: "Prepare it.",     sub: "Your agent assembles the documents and fills the forms." },
  { id: "track",       label: "Track it.",       sub: "Stay updated without checking government portals yourself." },
];

export default function AgenticProgression() {
  const [active, setActive] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger each beat
          BEATS.forEach((_, i) => {
            setTimeout(() => setActive(i), i * 220);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        padding: "7rem 2rem",
        background: "#FAF8F4",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {BEATS.map((beat, i) => (
          <div
            key={beat.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                transition: "opacity 0.5s ease, transform 0.5s ease",
                opacity: active >= i ? 1 : 0.15,
                transform: active >= i ? "none" : "translateY(8px)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: '"Times New Roman", Georgia, serif',
                  fontWeight: 700,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: active >= i ? "#0B1220" : "#A7AFC6",
                  letterSpacing: "-0.02em",
                  transition: "color 0.5s ease",
                  display: "block",
                }}
              >
                {beat.label}
              </span>
              <span
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: "0.9rem",
                  color: "#8C816C",
                  display: "block",
                  marginTop: "0.25rem",
                  maxWidth: "180px",
                  lineHeight: 1.4,
                }}
              >
                {beat.sub}
              </span>
            </div>

            {/* Arrow between beats */}
            {i < BEATS.length - 1 && (
              <span
                aria-hidden="true"
                style={{
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  fontSize: "1.5rem",
                  color: "#C6841F",
                  opacity: active > i ? 1 : 0.2,
                  transition: "opacity 0.5s ease",
                  alignSelf: "flex-start",
                  marginTop: "0.25rem",
                }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
