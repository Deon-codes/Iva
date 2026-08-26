"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";

const C = {
  bg: "#E8F5E9",
  surface: "#FFFFFF",
  border: "#C8E6C9",
  green50: "#E8F5E9",
  green100: "#C8E6C9",
  green400: "#66BB6A",
  green700: "#2E7D32",
  green800: "#1B5E20",
  text: "#0A270D",
  muted: "#2E7D32",
  dim: "#81C784",
};

const bloubFile = (state) =>
  `/bloub-${state === "Surprised" ? "suprised" : (state || "neutral").toLowerCase()}.svg`;

function stepsFor(query) {
  const q = query.toLowerCase();
  if (q.includes("prepare") || q.includes("apply"))
    return [
      { text: "Loading user profile", done: false },
      { text: "Verifying eligibility criteria", done: false },
      { text: "Cross-matching DigiLocker docs", done: false },
      { text: "Compiling draft form data", done: false },
      { text: "OTP handoff required", done: false, locked: true },
    ];
  if (q.includes("find") || q.includes("scholarship") || q.includes("qualify"))
    return [
      { text: "Checking academic profile", done: false },
      { text: "Checking state & income bounds", done: false },
      { text: "Searching NSP & MahaDBT", done: false },
      { text: "Ranking matches", done: false },
    ];
  if (q.includes("why") || q.includes("reject") || q.includes("mismatch"))
    return [
      { text: "Fetching submission log", done: false },
      { text: "Extracting rejection code", done: false },
      { text: "Comparing profile vs documents", done: false },
      { text: "Formulating resolution path", done: false },
    ];
  return [
    { text: "Reading context", done: false },
    { text: "Analysing query", done: false },
    { text: "Composing response", done: false },
  ];
}

function daysUntilExpiry(expiryDate) {
  if (!expiryDate || expiryDate === "Never" || expiryDate.startsWith("Never")) return 999;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ChatPage() {
  const {
    chatHistory, agentState, sendMessage, setAgentState,
    pendingPrompt, setPendingPrompt,
    applications, documents, schemes, user,
  } = useApp();

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [steps, setSteps] = useState([]);
  const msgEnd = useRef(null);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, thinking, steps]);

  useEffect(() => {
    if (pendingPrompt) {
      fire(pendingPrompt);
      setPendingPrompt("");
    }
  }, [pendingPrompt]);

  async function fire(text) {
    if (!text.trim() || thinking) return;
    setThinking(true);
    const s = stepsFor(text).map((step, i) => ({ ...step, active: i === 0 }));
    setSteps(s);

    const interval = setInterval(() => {
      setSteps((old) => {
        const activeIdx = old.findIndex((step) => step.active);
        const next = activeIdx + 1;
        if (next >= old.length) return old;
        return old.map((step, i) => ({
          ...step,
          done: i <= activeIdx,
          active: i === next,
        }));
      });
    }, 1400);

    await sendMessage(text);
    clearInterval(interval);
    setSteps([]);
    setThinking(false);
  }

  function submit(e) {
    e.preventDefault();
    fire(input);
    setInput("");
  }

  const workCards = [
    ...(schemes.length
      ? [{ id: "wc-schemes", icon: "🎯", title: "Matching Schemes", label: `${schemes.length} opportunities found`, sub: "Agent scanned your profile", href: "/explore", badge: schemes.length, accent: C.green400 }]
      : []),
    ...applications.filter((a) => a.status === "Action Required").map((a) => ({
      id: `wc-app-${a.id}`, icon: "⚠️", title: "Action Required", label: a.name, sub: "Income mismatch flagged", href: "/applications", badge: "!", accent: "#E08E00",
    })),
    ...documents
      .map((d) => ({ ...d, daysLeft: daysUntilExpiry(d.expiryDate) }))
      .filter((d) => d.daysLeft < 30)
      .map((d) => ({
        id: `wc-doc-${d.id}`, icon: "📄", title: "Document Alert", label: d.type, sub: `Expires in ${d.daysLeft} days`, href: "/documents", badge: d.daysLeft, accent: "#C62828",
      })),
    { id: "wc-deadline", icon: "⏰", title: "Deadline", label: "PM National Relief Fund", sub: "Closing in 5 days", href: "/explore", badge: "5d", accent: C.green700 },
  ].slice(0, 4);

  const pendingCount = applications.filter((a) =>
    ["Action Required", "Preparing Application"].includes(a.status)
  ).length;

  const bloub = bloubFile(agentState);
  const stateLabel =
    {
      Neutral: "Ready to help",
      Attentive: "Listening…",
      Excited: "Found a match!",
      Confused: "Needs clarification",
      Suspicious: "Flagged issue",
      Sleepy: "Waiting…",
      Surprised: "Unexpected update",
    }[agentState] || "Ready to help";

  const hasMessages = chatHistory.length > 0 || thinking;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* CENTER — Agent workspace */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Mobile section nav */}
        <div className="flex lg:hidden" style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "0.625rem 1rem", gap: "0.5rem", overflowX: "auto", flexShrink: 0 }}>
          {[
            { href: "/chat", icon: "💬", label: "Chat", count: null, active: true },
            { href: "/explore", icon: "🔍", label: "Explore", count: schemes.length },
            { href: "/applications", icon: "📋", label: "Applications", count: pendingCount || null },
          ].map(({ href, icon, label, count, active }) => (
            <Link key={href} href={href} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "9999px", background: active ? C.green800 : C.green50, color: active ? "#fff" : C.green700, fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", border: `1px solid ${active ? C.green800 : C.border}`, whiteSpace: "nowrap" }}>
              {icon} {label}
              {count != null && count > 0 && (
                <span style={{ background: active ? C.green400 : C.green800, color: "white", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 800, padding: "0 5px", minWidth: 18, textAlign: "center" }}>{count}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Empty-state hero (desktop reference) */}
        {!hasMessages && (
          <div style={{ padding: "2.5rem 1.5rem 1rem", textAlign: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <div
                className={`bloub bloub-${(agentState || "neutral").toLowerCase()}`}
                style={{ width: 120, height: 120, overflow: "hidden", background: C.green100, boxShadow: "0 8px 32px rgba(27,94,32,0.15)" }}
              >
                <img
                  src={bloub}
                  alt={`Bloub ${agentState}`}
                  width={120}
                  height={120}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.style.background = `linear-gradient(135deg,${C.green400},${C.green800})`;
                  }}
                />
              </div>
            </div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, color: C.green800, marginBottom: "0.375rem" }}>
              Hello, {firstName}
            </h2>
            <p style={{ fontSize: "0.95rem", color: C.muted }}>How can I assist you today?</p>
          </div>
        )}

        {/* Active chat header (mobile reference) */}
        {hasMessages && (
          <div className="flex lg:hidden" style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <div className={`bloub bloub-${(agentState || "neutral").toLowerCase()}`} style={{ width: 36, height: 36, overflow: "hidden", background: C.green100, flexShrink: 0 }}>
              <img src={bloub} alt="Bloub" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.green800 }}>Hazela Agent</div>
              <div style={{ fontSize: "0.72rem", color: C.green400 }}>{stateLabel}</div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {chatHistory.map((msg) => (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }} className="slide-up">
              <div className={msg.sender === "user" ? "msg-user" : "msg-agent"} style={{ maxWidth: "82%", padding: "0.625rem 1rem", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {msg.text}
              </div>
              {msg.workCards?.map((card) => (
                <div key={card.id} className="work-card" style={{ maxWidth: "82%", marginTop: 8, borderLeft: `4px solid ${card.status === "attention" ? "#C62828" : C.green800}` }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: card.status === "attention" ? "#C62828" : C.green800 }}>{card.title}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, marginTop: 4 }}>{card.description}</div>
                  <Link href="/applications" style={{ fontSize: "0.75rem", fontWeight: 700, color: C.green800, marginTop: 8, display: "inline-block" }}>View →</Link>
                </div>
              ))}
              <span style={{ fontSize: "0.7rem", color: C.dim, marginTop: 3, padding: "0 0.25rem" }}>{msg.timestamp}</span>
            </div>
          ))}

          {thinking && (
            <div className="slide-up" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div className="msg-agent" style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", minWidth: 180 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: steps.length ? "0.625rem" : 0 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.green400, animation: `ping 1s ${i * 0.2}s cubic-bezier(0,0,0.2,1) infinite`, display: "inline-block" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: C.muted, fontWeight: 600 }}>Working…</span>
                </div>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.2rem 0", fontSize: "0.75rem", opacity: step.locked ? 0.5 : 1 }} className={step.active ? "step-item" : ""}>
                    <span>{step.locked ? "🔒" : step.done ? "✓" : step.active ? "●" : "○"}</span>
                    <span style={{ color: step.done ? C.dim : step.active ? C.text : C.muted, fontWeight: step.active ? 700 : 400, textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={msgEnd} />
        </div>

        {/* Contextual work cards row (empty state — desktop reference) */}
        {!hasMessages && workCards.length > 0 && (
          <div style={{ padding: "0 1.25rem 1rem", flexShrink: 0 }}>
            <div className="hidden md:grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
              {workCards.map((card, i) => (
                <Link key={card.id} href={card.href} style={{ textDecoration: "none" }}>
                  <div className="work-card" style={{ minHeight: 130, borderLeft: `4px solid ${card.accent}`, marginTop: i > 0 ? -8 : 0, position: "relative", zIndex: 10 + i }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: C.green800 }}>{card.title}</span>
                      <span style={{ background: C.green800, color: "#fff", borderRadius: 9999, fontSize: "0.65rem", fontWeight: 800, padding: "2px 7px" }}>{card.badge}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{card.label}</div>
                    <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: 6 }}>{card.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: "0.875rem 1.25rem 1rem", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
          <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", background: C.green50, border: `1.5px solid ${thinking ? C.green400 : C.border}`, borderRadius: "9999px", padding: "0.5rem 0.75rem 0.5rem 1rem", gap: "0.5rem" }}>
              <span style={{ color: C.dim, fontSize: "0.85rem", flexShrink: 0 }} aria-hidden>📎</span>
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (!thinking && agentState === "Neutral") setAgentState("Attentive");
                }}
                onFocus={() => {
                  if (!thinking && agentState === "Neutral") setAgentState("Attentive");
                }}
                onBlur={() => {
                  if (!input.trim() && agentState === "Attentive") setAgentState("Neutral");
                }}
                disabled={thinking}
                placeholder={thinking ? "Agent is working…" : "Ask me anything…"}
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "0.9rem", color: C.text, fontFamily: "inherit", minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => fire("Deep research on scholarships matching my profile")}
                style={{ background: C.green800, border: "none", cursor: "pointer", fontSize: "0.72rem", color: "#fff", fontWeight: 700, whiteSpace: "nowrap", fontFamily: "inherit", padding: "0.4rem 0.75rem", borderRadius: 9999, flexShrink: 0 }}
              >
                Deeper Research
              </button>
            </div>
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              style={{ width: 44, height: 44, borderRadius: "50%", background: thinking || !input.trim() ? C.green100 : C.green800, color: thinking || !input.trim() ? C.dim : "#fff", border: "none", fontWeight: 700, fontSize: "1.1rem", cursor: thinking || !input.trim() ? "not-allowed" : "pointer", flexShrink: 0 }}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT — Work cards & trending (desktop) */}
      <div className="hidden xl:flex" style={{ width: 300, flexShrink: 0, flexDirection: "column", borderLeft: `1px solid ${C.border}`, background: C.surface, padding: "1.25rem 1rem", gap: "1rem", overflowY: "auto" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.dim }}>Agent Work Cards</div>

        {workCards.map((card, i) => (
          <Link key={card.id} href={card.href} style={{ textDecoration: "none" }}>
            <div className="work-card" style={{ marginTop: i > 0 ? "-0.5rem" : 0, zIndex: 10 + i, position: "relative", borderLeft: `4px solid ${card.accent}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", color: C.green800 }}>{card.title}</span>
                <span style={{ background: C.green800, color: "#fff", borderRadius: 9999, fontSize: "0.65rem", fontWeight: 800, padding: "2px 7px" }}>{card.badge}</span>
              </div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.text }}>{card.label}</div>
              <div style={{ fontSize: "0.72rem", color: C.muted, marginTop: 4 }}>{card.sub}</div>
              <div style={{ fontSize: "0.68rem", color: card.accent, fontWeight: 700, marginTop: "0.375rem" }}>View →</div>
            </div>
          </Link>
        ))}

        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.dim, marginBottom: "0.5rem" }}>Trending for you</div>
          {schemes.slice(0, 3).map((scheme) => (
            <div key={scheme.id} style={{ padding: "0.625rem 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{scheme.name}</div>
              <div style={{ fontSize: "0.68rem", color: C.muted, marginTop: 2 }}>{scheme.department}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.dim, marginBottom: "0.5rem" }}>Quick Actions</div>
          {[
            { label: "Find scholarships I qualify for", prompt: "Find scholarships matching my profile" },
            { label: "Why was my application flagged?", prompt: "Why was my Central Sector application flagged?" },
            { label: "Fix certificate mismatch", prompt: "Fix my profile income certificate mismatch" },
          ].map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => fire(prompt)}
              disabled={thinking}
              style={{ width: "100%", textAlign: "left", padding: "0.6rem 0.875rem", marginBottom: "0.375rem", background: C.green50, border: `1px solid ${C.border}`, borderRadius: "0.75rem", fontSize: "0.8rem", fontWeight: 600, color: C.green800, cursor: thinking ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              {label} →
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
