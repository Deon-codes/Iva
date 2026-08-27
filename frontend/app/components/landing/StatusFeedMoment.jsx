"use client";
import { useEffect, useRef, useState } from "react";

const FEED_ITEMS = [
  {
    icon: "✓",
    label: "Under Review",
    sub: "Your application is being reviewed.",
    status: "success",
  },
  {
    icon: "⚠",
    label: "Action Required",
    sub: "Your income certificate needs to be renewed. Next action: Upload the updated certificate.",
    status: "attention",
  },
  {
    icon: "✓",
    label: "Approved",
    sub: "Your application has been approved.",
    status: "approved",
  },
  {
    icon: "✕",
    label: "Rejected",
    sub: "Why: Eligibility requirement not met.",
    status: "rejected",
  },
];

const STATUS_COLORS = {
  success: "#4CAF50",
  attention: "#E07B39",
  approved: "#2E7D32",
  rejected: "#C62828",
};

const STATUS_BG = {
  success: "#F3EFE9",
  attention: "#FFF3ED",
  approved: "#F3EFE9",
  rejected: "#FFEBEE",
};

export default function StatusFeedMoment() {
  const [visible, setVisible] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          FEED_ITEMS.forEach((_, i) => {
            setTimeout(() => setVisible(v => v + 1), 200 + i * 350);
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
      style={{
        padding: "7rem 2rem",
        background: "#F3EFE9",
        borderTop: "1px solid #E5DFD5",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
        className="feed-grid"
      >
        {/* Left: Headline */}
        <div>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "#061508",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.25rem",
            }}
          >
            Don't lose an application after you submit it.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#2A3B2D",
              lineHeight: 1.65,
              marginBottom: "1rem",
            }}
          >
            Applications don't end when you press submit.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#2A3B2D",
              lineHeight: 1.65,
            }}
          >
            Your agent keeps the important context together and helps you understand what happens next.
          </p>
        </div>

        {/* Right: Feed card */}
        <div
          ref={ref}
          style={{
            background: "#fff",
            border: "1px solid #E5DFD5",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 4px 10px -2px rgba(10,39,13,0.08)",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #E5DFD5",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#FAFAF8",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4CAF50" }} />
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 600, fontSize: "0.8125rem", color: "#1B5E20" }}>
              Application Activity
            </span>
          </div>

          {/* Feed items */}
          <div style={{ padding: "1rem 0" }}>
            {FEED_ITEMS.map((item, i) => (
              <div
                key={i}
                className="feed-item"
                style={{
                  padding: "0.875rem 1.25rem",
                  display: "flex",
                  gap: "0.875rem",
                  alignItems: "flex-start",
                  animationDelay: `${i * 350 + 200}ms`,
                  opacity: 0,
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: STATUS_BG[item.status],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: STATUS_COLORS[item.status],
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 700, fontSize: "0.875rem", color: "#061508", marginBottom: "3px" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 400, fontSize: "0.8125rem", color: "#2A3B2D", lineHeight: 1.5 }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .feed-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
      `}</style>
    </section>
  );
}
