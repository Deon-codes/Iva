"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { Target, AlertTriangle, FileText, Clock, CheckCircle, Check, Lock, CircleDot, Circle, ArrowUp } from "lucide-react";

const C = {
  bg: "#F5F3EF",
  surface: "#FFFFFF",
  canvas: "#FAF8F5",
  border: "#E5E0D8",
  borderLight: "#F0EDE8",
  muted: "#6B7280",
  dim: "#A0A0A0",
  text: "#061508",
  green50: "#E8F5E9",
  green400: "#66BB6A",
  green700: "#2E7D32",
  green800: "#1B5E20",
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

  // Build status cards from real data
  const allCards = [
    ...(schemes.length
      ? [{ id: "wc-schemes", icon: <Target size={16} />, title: "Matching Schemes", detail: "Agent scanned your profile", count: schemes.length, countColor: C.green800, bgColor: C.green50, href: "/explore" }]
      : []),
    ...applications.filter((a) => a.status === "Action Required").map((a) => ({
      id: `wc-app-${a.id}`, icon: <AlertTriangle size={16} />, title: "Action Required", detail: a.name, count: "!", countColor: "#C62828", bgColor: "#FFEBEE", href: "/applications",
    })),
    ...documents
      .map((d) => ({ ...d, daysLeft: daysUntilExpiry(d.expiryDate) }))
      .filter((d) => d.daysLeft < 30)
      .map((d) => ({
        id: `wc-doc-${d.id}`, icon: <FileText size={16} />, title: "Document Alert", detail: d.type, count: d.daysLeft, countColor: "#C62828", bgColor: "#FFEBEE", href: "/documents",
      })),
    { id: "wc-deadline", icon: <Clock size={16} />, title: "Deadline", detail: "PM National Relief Fund", count: "5d", countColor: C.green700, bgColor: C.green50, href: "/explore" },
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

      {/* CENTER — Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ══════ STATUS STRIP — desktop only ══════ */}
        <div className="hidden md:block" style={{ padding: "0.75rem 1.25rem", flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {allCards.length > 0 ? (
            <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              {allCards.map((card) => (
                <Link key={card.id} href={card.href} style={{ textDecoration: "none", flex: "1 1 0", minWidth: 140 }}>
                  <div
                    className="status-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      background: C.canvas,
                      border: `1px solid ${C.border}`,
                      borderRadius: "0.625rem",
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ lineHeight: 1, display: "flex", alignItems: "center" }}>{card.icon}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.title}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: card.countColor, background: card.bgColor, borderRadius: "9999px", padding: "1px 7px", lineHeight: 1.4, flexShrink: 0 }}>{card.count}</span>
                    {/* Hover detail — hidden by default, revealed on hover */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, padding: "0.3rem 0.75rem", fontSize: "0.68rem", color: C.muted, maxHeight: 0, overflow: "hidden", opacity: 0, transition: "all 0.2s" }} className="status-detail">
                      {card.detail}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.25rem 0" }}>
              <span style={{ lineHeight: 1, display: "flex", alignItems: "center" }}><CheckCircle size={18} color="#2E7D32" /></span>
              <div>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: C.text }}>You&apos;re all caught up</span>
                <span style={{ fontSize: "0.72rem", color: C.dim, marginLeft: "0.5rem" }}>No actions need your attention right now</span>
              </div>
            </div>
          )}
        </div>



        {/* ══════ Empty-state hero ══════ */}
        {!hasMessages && (
          <div style={{ padding: "2rem 1.5rem 1rem", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <div
                className={`bloub bloub-${(agentState || "neutral").toLowerCase()}`}
                style={{ width: 110, height: 110, overflow: "hidden", background: C.borderLight, boxShadow: "0 8px 32px rgba(6,21,8,0.08)" }}
              >
                <img
                  src={bloub}
                  alt={`Bloub ${agentState}`}
                  width={110}
                  height={110}
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

        {/* ══════ Messages ══════ */}
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
                    <span style={{ display: "inline-flex", alignItems: "center" }}>{step.locked ? <Lock size={14} /> : step.done ? <Check size={14} /> : step.active ? <CircleDot size={14} /> : <Circle size={14} />}</span>
                    <span style={{ color: step.done ? C.dim : step.active ? C.text : C.muted, fontWeight: step.active ? 700 : 400, textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={msgEnd} />
        </div>

        {/* ══════ Input bar ══════ */}
        <div style={{ padding: "0.75rem 1.25rem 0.875rem", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
          <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", background: C.canvas, border: `1.5px solid ${thinking ? C.green400 : C.border}`, borderRadius: "9999px", padding: "0.5rem 0.75rem 0.5rem 1rem", gap: "0.5rem" }}>

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
                disabled={thinking}
                style={{ background: C.green800, border: "none", cursor: thinking ? "not-allowed" : "pointer", fontSize: "0.72rem", color: "#fff", fontWeight: 700, whiteSpace: "nowrap", fontFamily: "inherit", padding: "0.4rem 0.75rem", borderRadius: 9999, flexShrink: 0, opacity: thinking ? 0.5 : 1 }}
              >
                Deeper Research
              </button>
            </div>
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              style={{ width: 44, height: 44, borderRadius: "50%", background: thinking || !input.trim() ? "#E5E0D8" : C.green800, color: thinking || !input.trim() ? "#A0A0A0" : "#fff", border: "none", fontWeight: 700, fontSize: "1.1rem", cursor: thinking || !input.trim() ? "not-allowed" : "pointer", flexShrink: 0 }}
              aria-label="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>

      {/* ══════ RIGHT — Trending sidebar (desktop) ══════ */}
      <div className="hidden xl:flex" style={{ width: 300, flexShrink: 0, flexDirection: "column", borderLeft: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ padding: "1rem 1rem 0.75rem", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.dim }}>Trending for you</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 1rem" }}>
          {schemes.length > 0 ? (
            schemes.map((scheme) => (
              <div key={scheme.id} style={{ padding: "0.75rem 0", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer", transition: "background 0.15s" }} className="trending-item">
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{scheme.name}</div>
                <div style={{ fontSize: "0.68rem", color: C.dim, marginTop: 3 }}>{scheme.department}</div>
                {scheme.deadline && (
                  <div style={{ fontSize: "0.65rem", color: C.green700, marginTop: 3, fontWeight: 600 }}>
                    Deadline: {new Date(scheme.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: "1rem 0", textAlign: "center", color: C.dim, fontSize: "0.8125rem" }}>
              No trending schemes right now
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
