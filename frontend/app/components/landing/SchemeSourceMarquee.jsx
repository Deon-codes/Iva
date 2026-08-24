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
  // Duplicate for seamless loop
  const items = [...SOURCES, ...SOURCES];

  return (
    <section
      style={{
        padding: "4rem 0",
        background: "#F1EDE4",
        borderTop: "1px solid #E4DDCF",
        borderBottom: "1px solid #E4DDCF",
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
          color: "#8C816C",
          marginBottom: "2rem",
        }}
      >
        We check schemes against official government sources
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
                color: "#4C577A",
              }}
            >
              {source}
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#C6841F",
                  marginLeft: "2.5rem",
                  opacity: 0.7,
                }}
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
