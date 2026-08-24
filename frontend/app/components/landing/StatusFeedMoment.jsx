"use client";
import { useEffect, useRef, useState } from "react";

const FEED_ITEMS = [
  {
    icon: "✓",
    label: "Application submitted",
    sub: "PM YASASVI Scholarship · 2 days ago",
    status: "success",
  },
  {
    icon: "✓",
    label: "Status checked",
    sub: "Portal confirmed receipt · Yesterday",
    status: "success",
  },
  {
    icon: "●",
    label: "Waiting for department response",
    sub: "Expected within 10–14 working days",
    status: "pending",
  },
  {
    icon: "⚠",
    label: "Action required",
    sub: "Upload updated income certificate by 30 Aug",
    status: "attention",
  },
];

const STATUS_COLORS = {
  success:   "#4B7A5E",
  pending:   "#C6841F",
  attention: "#B4543D",
};

const STATUS_BG = {
  success:   "#E8F2ED",
  pending:   "#FFF8EC",
  attention: "#FBF0EE",
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
        background: "#FAF8F4",
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
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: "0.8125rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#C6841F",
              marginBottom: "1rem",
            }}
          >
            Ongoing monitoring
          </p>
          <h2
            style={{
              fontFamily: '"Times New Roman", Georgia, serif',
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "#0B1220",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.25rem",
            }}
          >
            You don't have to keep checking.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#4C577A",
              lineHeight: 1.65,
            }}
          >
            While you focus on what matters, your agent keeps tabs on every application — catching status changes, flagging required actions, and notifying you only when you need to act.
          </p>
        </div>

        {/* Right: Feed card */}
        <div
          ref={ref}
          style={{
            background: "#FCFAF6",
            border: "1px solid #E4DDCF",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 4px 10px -2px rgba(11,18,32,0.08)",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #F1EDE4",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4B7A5E" }} />
            <span
              style={{
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "#333D5C",
              }}
            >
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
                {/* Status icon */}
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

                {/* Text */}
                <div>
                  <p
                    style={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#0B1220",
                      marginBottom: "2px",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontWeight: 400,
                      fontSize: "0.8125rem",
                      color: "#8C816C",
                    }}
                  >
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
          .feed-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}
