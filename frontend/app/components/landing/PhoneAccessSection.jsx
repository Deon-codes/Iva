export default function PhoneAccessSection() {
  return (
    <section
      style={{
        padding: "5rem 2rem",
        background: "#FAF8F4",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1.75rem",
        }}
      >
        {/* Voice icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#4C577A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Phone handset */}
            <path d="M10 14a4 4 0 014-4h3l3 8-4 2a24 24 0 0010 10l2-4 8 3v3a4 4 0 01-4 4C17 36 10 28 10 14z" />
            {/* Waveform beside phone */}
            <line x1="32" y1="16" x2="32" y2="24" />
            <line x1="36" y1="12" x2="36" y2="28" />
            <line x1="40" y1="16" x2="40" y2="24" />
          </svg>
        </div>

        {/* Headline */}
        <div>
          <h2
            style={{
              fontFamily: '"Times New Roman", Georgia, serif',
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              color: "#0B1220",
              letterSpacing: "-0.02em",
              marginBottom: "0.875rem",
            }}
          >
            No smartphone? No problem.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#4C577A",
              lineHeight: 1.65,
              maxWidth: "480px",
            }}
          >
            Hazela is built for every student — including those without a smartphone. Access scheme discovery and application status updates over a basic phone call or voice service.
          </p>
        </div>

        {/* Subtle note */}
        <p
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: "0.875rem",
            color: "#B0A48D",
            fontStyle: "italic",
          }}
        >
          Voice accessibility — coming soon
        </p>
      </div>
    </section>
  );
}
