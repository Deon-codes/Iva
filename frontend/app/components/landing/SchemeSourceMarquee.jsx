"use client";

const SOURCES = [
  "National Scholarship Portal",
  "PM YASASVI",
  "Post-Matric Scholarship",
  "State Education Boards",
  "AICTE Schemes",
  "Ministry of Education",
  "Minority Affairs",
  "SC/ST Scholarship Portal",
  "OBC Welfare Schemes",
  "DigiLocker Verified",
  "UGC Fellowships",
  "District Welfare Offices",
  "Skill India Missions",
  "State Government Portals",
];

export default function SchemeSourceMarquee() {
  const items = [...SOURCES, ...SOURCES];

  return (
    <section
      style={{
        padding: "3.5rem 0",
        background: "#061508",
        overflow: "hidden",
      }}
    >
      {/* Caption */}
      <p
        style={{
          textAlign: "center",
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 500,
          fontSize: "0.8125rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4CAF50",
          marginBottom: "1.75rem",
          opacity: 0.8,
        }}
      >
        Checks against official government sources
      </p>

      {/* Marquee */}
      <div className="marquee-wrapper" style={{ overflow: "hidden" }}>
        <div className="marquee-track">
          {items.map((source, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                padding: "0 2.5rem",
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: "0.9375rem",
                color: "#D5CDC0",
              }}
            >
              {source}
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  color: "#2E7D32",
                  marginLeft: "2.5rem",
                  fontSize: "1.1rem",
                }}
              >
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
