export default function TrustControlSection() {
  return (
    <section
      id="trust"
      style={{
        padding: "7rem 2rem",
        background: "#F1EDE4",
        borderTop: "1px solid #E4DDCF",
        borderBottom: "1px solid #E4DDCF",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "5rem",
          alignItems: "start",
        }}
        className="trust-grid"
      >
        {/* Left: Text */}
        <div>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: "0.8125rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#B0A48D",
              marginBottom: "1rem",
            }}
          >
            Your agent, your control
          </p>
          <h2
            style={{
              fontFamily: '"Times New Roman", Georgia, serif',
              fontWeight: 700,
              fontSize: "clamp(1.625rem, 3vw, 2.25rem)",
              color: "#0B1220",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            Your agent handles the work. You make the important decisions.
          </h2>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#4C577A",
              lineHeight: 1.65,
              marginBottom: "1.25rem",
            }}
          >
            Your agent can research, prepare, and assemble everything — but it never submits on your behalf without a clear confirmation from you.
          </p>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "1.0625rem",
              color: "#4C577A",
              lineHeight: 1.65,
            }}
          >
            Identity verification and OTP-based authorisation are always manual steps — handled directly by you, never automated. Your Aadhaar and sensitive documents stay yours.
          </p>
        </div>

        {/* Right: Flow diagram */}
        <div>
          <p
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 500,
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#B0A48D",
              marginBottom: "1.5rem",
            }}
          >
            How decisions flow
          </p>

          {/* Flow nodes */}
          {[
            { label: "Profile matched to schemes", agent: true },
            { label: "Documents assembled", agent: true },
            { label: "Application drafted", agent: true },
            { label: "You review & confirm", agent: false, highlight: true },
            { label: "OTP verification", agent: false },
            { label: "Submission & tracking", agent: true },
          ].map((node, i, arr) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.75rem 1rem",
                  background: node.highlight
                    ? "#0B1220"
                    : node.agent
                    ? "#FCFAF6"
                    : "#FAF8F4",
                  border: `1px solid ${node.highlight ? "#0B1220" : "#E4DDCF"}`,
                  borderRadius: "0.5rem",
                  transition: "box-shadow 0.2s",
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: node.highlight ? "#C6841F" : node.agent ? "#4B7A5E" : "#A7AFC6",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    fontWeight: node.highlight ? 600 : 400,
                    fontSize: "0.875rem",
                    color: node.highlight ? "#FAF8F4" : "#232B45",
                    flex: 1,
                  }}
                >
                  {node.label}
                </span>
                <span
                  style={{
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: node.highlight ? "#C6841F" : node.agent ? "#4B7A5E" : "#8C816C",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {node.highlight ? "You" : node.agent ? "Agent" : "You"}
                </span>
              </div>

              {/* Connector */}
              {i < arr.length - 1 && (
                <div
                  style={{
                    width: "1px",
                    height: "20px",
                    background: "#D3D7E3",
                    margin: "0 auto",
                    marginLeft: "1.375rem",
                  }}
                />
              )}
            </div>
          ))}

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              marginTop: "1.5rem",
            }}
          >
            {[
              { color: "#4B7A5E", label: "Agent handles" },
              { color: "#C6841F", label: "You decide" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
                <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: "0.75rem", color: "#8C816C" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .trust-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </section>
  );
}
