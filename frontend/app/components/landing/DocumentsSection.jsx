export default function DocumentsSection() {
  return (
    <section
      style={{
        padding: "5rem 2rem",
        background: "#FAF8F4",
        borderBottom: "1px solid #E4DDCF",
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
        {/* Icon trio */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {/* Document */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#4C577A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="3" width="18" height="28" rx="2" />
            <line x1="11" y1="11" x2="21" y2="11" />
            <line x1="11" y1="16" x2="21" y2="16" />
            <line x1="11" y1="21" x2="17" y2="21" />
          </svg>

          {/* Arrow */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#C6841F" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 10h12M12 6l4 4-4 4" />
          </svg>

          {/* Checkmark */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid #4B7A5E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#4B7A5E" strokeWidth="1.75" strokeLinecap="round">
              <polyline points="3,8 6,11 13,5" />
            </svg>
          </div>

          {/* Arrow */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#C6841F" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 10h12M12 6l4 4-4 4" />
          </svg>

          {/* Reuse */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#4C577A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="6" width="14" height="18" rx="2" />
            <rect x="17" y="12" width="14" height="18" rx="2" fill="#FAF8F4" />
            <path d="M22 8l3 3-3 3" />
          </svg>
        </div>

        {/* Text */}
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
            Connect your documents once. Reuse them across applications.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#4C577A",
              lineHeight: 1.65,
              maxWidth: "520px",
            }}
          >
            Link your DigiLocker account and your verified documents are ready whenever your agent needs them — no scanning, no re-uploading for every new scheme.
          </p>
        </div>

        {/* Digilocker badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#F1EDE4",
            border: "1px solid #E4DDCF",
            borderRadius: "9999px",
            padding: "0.375rem 1rem",
          }}
        >
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4B7A5E" }} />
          <span
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: "0.8125rem",
              color: "#4C577A",
            }}
          >
            DigiLocker verified · Government of India
          </span>
        </div>
      </div>
    </section>
  );
}
