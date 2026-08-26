"use client";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";

const JAKARTA = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useApp();
  const [name, setName] = useState("Aarav Sharma");
  const [phone, setPhone] = useState("+91 98765 43210");

  const handleSubmit = (e) => {
    e.preventDefault();
    login(name, phone);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#E8F5E9", padding: "1.5rem" }}
    >
      {/* Ambient background blobs */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          top: "-8rem",
          right: "-8rem",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(102,187,106,0.18), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          bottom: "-10rem",
          left: "-6rem",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(27,94,32,0.10), transparent 70%)",
          filter: "blur(48px)",
          pointerEvents: "none",
        }}
      />

      <div className="relative w-full slide-up" style={{ maxWidth: 1020, zIndex: 10 }}>
        <div
          className="flex flex-col md:flex-row bg-white overflow-hidden"
          style={{
            borderRadius: "2rem",
            boxShadow: "0 25px 60px -15px rgba(6, 58, 20, 0.25)",
            border: "1px solid #C8E6C9",
            minHeight: 580,
          }}
        >
          {/* ── Left Panel — Bloub, centered ─────────────────────────────── */}
          <div
            className="relative hidden md:flex items-center justify-center overflow-hidden"
            style={{
              width: "42%",
              background: "linear-gradient(160deg, #1B5E20 0%, #2E7D32 55%, #3B8C40 100%)",
            }}
          >
            {/* Decorative shapes */}
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{ top: -70, right: -70, width: 230, height: 230, background: "rgba(255,255,255,0.06)" }}
            />
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{ bottom: -100, left: -60, width: 260, height: 260, background: "rgba(0,0,0,0.10)" }}
            />
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{ bottom: 60, right: 40, width: 90, height: 90, background: "rgba(255,255,255,0.05)" }}
            />

            {/* Bloub — centered, fits the card */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 240,
                height: 240,
                borderRadius: "2rem",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.22)",
                backdropFilter: "blur(4px)",
                boxShadow: "0 20px 40px -12px rgba(0,0,0,0.35)",
              }}
            >
              <img
                src="/bloub-login-cycle.gif"
                alt="Bloub — your agent"
                width={190}
                height={190}
                style={{ width: 190, height: 190, objectFit: "contain" }}
                onError={(e) => {
                  e.target.src = "/bloub-neutral.svg";
                }}
              />
            </div>

            {/* Decorative dots */}
            <div className="absolute flex" style={{ bottom: 24, left: 24, gap: 6 }}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-full bg-white"
                  style={{ width: 6, height: 6, opacity: 0.35 + i * 0.25 }}
                />
              ))}
            </div>
          </div>

          {/* ── Right Panel — Auth Form ────────────────────────────────── */}
          <div
            className="flex flex-col justify-center bg-white"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "clamp(2rem, 4.5vw, 3.5rem) clamp(1.5rem, 4vw, 3.5rem)",
            }}
          >
            {/* Mobile-only Bloub */}
            <div className="md:hidden flex justify-center" style={{ marginBottom: "1.5rem" }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "1.5rem",
                  background: "#E8F5E9",
                  border: "1px solid #C8E6C9",
                }}
              >
                <img
                  src="/bloub-login-cycle.gif"
                  alt="Bloub — your agent"
                  width={72}
                  height={72}
                  style={{ width: 72, height: 72, objectFit: "contain" }}
                  onError={(e) => {
                    e.target.src = "/bloub-neutral.svg";
                  }}
                />
              </div>
            </div>

            {/* Brand */}
            <div style={{ marginBottom: "2rem" }}>
              <a
                href="/"
                className="inline-block font-serif font-extrabold hover:opacity-80 transition-opacity"
                style={{ ...SERIF, fontSize: "1.875rem", color: "#1B5E20", lineHeight: 1.2 }}
              >
                hazela
              </a>
              <h1
                className="font-bold"
                style={{ ...JAKARTA, fontSize: "1.375rem", color: "#0A270D", marginTop: "0.75rem", marginBottom: "0.375rem" }}
              >
                Sign in to your workspace
              </h1>
              <p className="text-sm" style={{ ...JAKARTA, color: "#2E7D32" }}>
                New here?{" "}
                <a
                  href="/signup"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: "#F57C00", underlineOffset: "2px" }}
                >
                  Register a new profile
                </a>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label
                  htmlFor="name"
                  className="block font-semibold"
                  style={{ ...JAKARTA, fontSize: "0.8125rem", color: "#1B5E20", marginBottom: "0.5rem" }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 16, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <UserIcon />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="block w-full text-sm transition-all"
                    style={{
                      ...JAKARTA,
                      padding: "0.875rem 1rem 0.875rem 2.75rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "1rem",
                      color: "#0A270D",
                      background: "#FAFDF9",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#66BB6A";
                      e.target.style.boxShadow = "0 0 0 3px rgba(102,187,106,0.25)";
                      e.target.style.background = "#FFFFFF";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#C8E6C9";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "#FAFDF9";
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block font-semibold"
                  style={{ ...JAKARTA, fontSize: "0.8125rem", color: "#1B5E20", marginBottom: "0.5rem" }}
                >
                  Phone Number
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 16, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <PhoneIcon />
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="block w-full text-sm transition-all"
                    style={{
                      ...JAKARTA,
                      padding: "0.875rem 1rem 0.875rem 2.75rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "1rem",
                      color: "#0A270D",
                      background: "#FAFDF9",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#66BB6A";
                      e.target.style.boxShadow = "0 0 0 3px rgba(102,187,106,0.25)";
                      e.target.style.background = "#FFFFFF";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#C8E6C9";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "#FAFDF9";
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group w-full flex items-center justify-center font-bold text-white transition-all"
                style={{
                  ...JAKARTA,
                  gap: "0.625rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "1rem",
                  fontSize: "0.875rem",
                  background: "#1B5E20",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(27,94,32,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2E7D32";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(27,94,32,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1B5E20";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(27,94,32,0.25)";
                }}
              >
                Sign In
                <span
                  className="transition-transform duration-200"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                  style={{ display: "flex" }}
                >
                  <ArrowIcon />
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative" style={{ margin: "1.75rem 0" }} role="separator">
              <div className="absolute flex items-center" style={{ inset: 0 }}>
                <div className="w-full" style={{ borderTop: "1px solid #E8F5E9" }} />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="font-bold uppercase"
                  style={{
                    ...JAKARTA,
                    padding: "0 1rem",
                    background: "#FFFFFF",
                    color: "#81C784",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.14em",
                  }}
                >
                  Quick Access
                </span>
              </div>
            </div>

            {/* Demo button */}
            <button
              onClick={() => login("Aarav Sharma", "+91 98765 43210")}
              className="w-full flex justify-center items-center font-semibold transition-all"
              style={{
                ...JAKARTA,
                gap: "0.625rem",
                padding: "0.875rem 1rem",
                borderRadius: "1rem",
                fontSize: "0.875rem",
                color: "#1B5E20",
                background: "#E8F5E9",
                border: "1px solid #C8E6C9",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#C8E6C9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E8F5E9";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span aria-hidden="true">⚡</span>
              Proceed with Demo Profile
            </button>

            <p className="text-center" style={{ ...JAKARTA, fontSize: "0.6875rem", color: "#A5D6A7", marginTop: "1.5rem" }}>
              Demo environment — no real data leaves your device.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
