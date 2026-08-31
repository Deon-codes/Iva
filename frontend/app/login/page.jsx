"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { getAuthErrorMessage } from "../../lib/auth";

const JAKARTA = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, loginWithGoogle, loading: authLoading, user } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/chat");
    }
  }, [authLoading, user, router]);

  // Don't render the form while still resolving auth or while redirecting
  if (authLoading || user) {
    return (
      <main
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: "#E8F5E9", padding: "1.5rem" }}
      >
        <div style={{ width: 36, height: 36, border: "3px solid #A5D6A7", borderTopColor: "#1B5E20", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);

    if (!result.success) {
      setError(getAuthErrorMessage(result.error));
      setSubmitting(false);
    }
    // On success, onAuthStateChanged fires → user state updates → redirect
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(getAuthErrorMessage(result.error));
      setSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    // Demo mode: bypass Firebase, set local user and go to chat
    setSubmitting(true);
    const mockUser = {
      uid: "demo-user",
      email: "demo@iva.local",
      name: "Aarav Sharma",
      phone: "+91 98765 43210",
      state: "Maharashtra",
      education: "Undergraduate",
      category: "OBC",
      incomeRange: "₹2,00,000 - ₹2,50,000",
      preferences: "Technical courses, Maharashtra state schemes, Central government scholarships",
      age: "21",
      onboardingCompleted: true,
    };
    // Store in localStorage so AppContext picks it up via onAuthStateChanged
    // For demo mode we'll use a flag and push directly
    localStorage.setItem("iva_user", JSON.stringify(mockUser));
    // Use router push directly for demo mode
    router.push("/chat");
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
                Iva
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

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                style={{
                  ...JAKARTA,
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  borderRadius: "0.75rem",
                  background: "#FFF3E0",
                  border: "1px solid #FFCC80",
                  color: "#E65100",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center font-semibold transition-all"
              style={{
                ...JAKARTA,
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "1rem",
                fontSize: "0.875rem",
                color: "#3C4043",
                background: "#FFFFFF",
                border: "1px solid #DADCE0",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "#F8F9FA";
                  e.currentTarget.style.borderColor = "#C6C8CA";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.borderColor = "#DADCE0";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

            {/* Or divider */}
            <div className="relative" style={{ margin: "1.25rem 0" }} role="separator">
              <div className="absolute flex items-center" style={{ inset: 0 }}>
                <div className="w-full" style={{ borderTop: "1px solid #E8F5E9" }} />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="font-bold uppercase"
                  style={{
                    ...JAKARTA,
                    padding: "0 0.75rem",
                    background: "#FFFFFF",
                    color: "#A5D6A7",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.12em",
                  }}
                >
                  or
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label
                  htmlFor="email"
                  className="block font-semibold"
                  style={{ ...JAKARTA, fontSize: "0.8125rem", color: "#1B5E20", marginBottom: "0.5rem" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 16, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <EmailIcon />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={submitting}
                    className="block w-full text-sm transition-all"
                    style={{
                      ...JAKARTA,
                      padding: "0.875rem 1rem 0.875rem 2.75rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "1rem",
                      color: "#0A270D",
                      background: "#FAFDF9",
                      outline: "none",
                      opacity: submitting ? 0.6 : 1,
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
                  htmlFor="password"
                  className="block font-semibold"
                  style={{ ...JAKARTA, fontSize: "0.8125rem", color: "#1B5E20", marginBottom: "0.5rem" }}
                >
                  Password
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 16, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={submitting}
                    className="block w-full text-sm transition-all"
                    style={{
                      ...JAKARTA,
                      padding: "0.875rem 1rem 0.875rem 2.75rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "1rem",
                      color: "#0A270D",
                      background: "#FAFDF9",
                      outline: "none",
                      opacity: submitting ? 0.6 : 1,
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
                disabled={submitting}
                className="group w-full flex items-center justify-center font-bold text-white transition-all"
                style={{
                  ...JAKARTA,
                  gap: "0.625rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "1rem",
                  fontSize: "0.875rem",
                  background: "#1B5E20",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(27,94,32,0.25)",
                  opacity: submitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "#2E7D32";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(27,94,32,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1B5E20";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(27,94,32,0.25)";
                }}
              >
                {submitting ? <SpinnerIcon /> : null}
                {submitting ? "Signing in…" : "Sign In"}
                {!submitting && (
                  <span
                    className="transition-transform duration-200"
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(3px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                    style={{ display: "flex" }}
                  >
                    <ArrowIcon />
                  </span>
                )}
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
              onClick={handleDemoLogin}
              disabled={submitting}
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
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "#C8E6C9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
