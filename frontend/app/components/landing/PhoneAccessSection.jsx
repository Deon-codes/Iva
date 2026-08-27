"use client";

export default function PhoneAccessSection() {
  return (
    <section
      style={{
        padding: "6rem 2rem",
        background: "#F3EFE9",
        borderTop: "1px solid #E5DFD5",
        borderBottom: "1px solid #E5DFD5",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          background: "#FFFFFF",
          border: "1px solid #E5DFD5",
          borderRadius: "1.5rem",
          padding: "3.5rem 2.5rem",
          boxShadow: "0 8px 30px rgba(6, 21, 8, 0.03)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1.75rem",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#F3EFE9",
            border: "1px solid #D5CDC0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a2 2 0 012-2h2l2 5-2.5 1.5a14 14 0 006 6L17 16l5 2v2a2 2 0 01-2 2C10 22 6 16 6 8z" />
            <line x1="19" y1="9" x2="19" y2="14" />
            <line x1="22" y1="7" x2="22" y2="16" />
          </svg>
        </div>

        {/* Text */}
        <div>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              color: "#061508",
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              lineHeight: 1.2,
            }}
          >
            No smartphone? You can still ask for help.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#2A3B2D",
              lineHeight: 1.65,
              maxWidth: "520px",
              margin: "0 auto 1.25rem",
            }}
          >
            The agent is designed to extend beyond the screen. With phone-based access, users can ask about relevant schemes, hear important updates, and understand what action is needed without relying entirely on a smartphone or web interface.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "#2E7D32",
              lineHeight: 1.5,
            }}
          >
            Because access to government benefits shouldn't depend on how comfortable you are with apps.
          </p>
        </div>
      </div>
    </section>
  );
}
