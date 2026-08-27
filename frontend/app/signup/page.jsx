"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { getAuthErrorMessage } from "../../lib/auth";

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

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

export default function SignupPage() {
  const { signup, loading: authLoading, user } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!authLoading && user) {
    router.replace("/chat");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const result = await signup(email.trim(), password, name.trim(), phone.trim());

    if (!result.success) {
      setError(getAuthErrorMessage(result.error));
      setSubmitting(false);
    }
    // On success, navigates to /onboarding via signup function
  };

  const handleDemoSignup = () => {
    setSubmitting(true);
    const mockUser = {
      uid: "demo-user",
      email: "demo@hazela.local",
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
    localStorage.setItem("hazela_user", JSON.stringify(mockUser));
    router.push("/chat");
  };

  return (
    <main className="min-h-screen bg-[#E8F5E9] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background radial gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 70% 10%, rgba(198,132,31,0.04), transparent 50%), radial-gradient(circle at 10% 90%, rgba(35,43,69,0.03), transparent 40%)",
        }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex flex-col md:flex-row rounded-3xl shadow-xl overflow-hidden" style={{ border: "1px solid #C8E6C9" }}>
          {/* Left Panel — Bloub Character */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex-col items-center justify-center p-12 relative">
            <div className="relative mb-6">
              <img
                src="/bloub-login-cycle.gif"
                alt="Bloub - your agent"
                width={200}
                height={200}
                className="w-40 h-40 object-contain drop-shadow-lg"
                onError={(e) => {
                  e.target.src = "/bloub-neutral.svg";
                }}
              />
            </div>

            <h3
              className="text-2xl font-bold text-[#1B5E20] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create your workspace
            </h3>
            <p
              className="text-sm text-[#2E7D32] text-center max-w-[240px] leading-relaxed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Set up your profile so your agent can find the best scholarships
              and government schemes for you.
            </p>

            <div className="absolute bottom-6 left-6 flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#66BB6A]"
                  style={{ opacity: 0.4 + i * 0.2 }}
                />
              ))}
            </div>
          </div>

          {/* Right Panel — Auth Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
            {/* Mobile-only: small Bloub */}
            <div className="md:hidden flex justify-center mb-6">
              <img
                src="/bloub-login-cycle.gif"
                alt="Bloub"
                width={80}
                height={80}
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  e.target.src = "/bloub-neutral.svg";
                }}
              />
            </div>

            {/* Brand */}
            <a
              href="/"
              className="block text-center md:text-left font-serif font-extrabold text-3xl text-[#1B5E20] hover:opacity-85 transition-opacity mb-1"
            >
              hazela
            </a>
            <h2
              className="text-center md:text-left text-xl font-bold text-[#0A270D] mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Create your profile workspace
            </h2>
            <p
              className="text-center md:text-left text-sm text-[#2E7D32] mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Or{" "}
              <a
                href="/login"
                className="font-semibold text-[#F57C00] hover:text-[#E65100] transition-colors"
              >
                sign in to an existing workspace
              </a>
            </p>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-[#1B5E20] mb-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 12, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <UserIcon />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="block w-full text-sm transition-all"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "0.75rem",
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
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#1B5E20] mb-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 12, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <EmailIcon />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="block w-full text-sm transition-all"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "0.75rem",
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
                  htmlFor="phone"
                  className="block text-sm font-semibold text-[#1B5E20] mb-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Phone Number
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 12, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="7" y="2" width="10" height="20" rx="2" />
                      <line x1="11" y1="18" x2="13" y2="18" />
                    </svg>
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    className="block w-full text-sm transition-all"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "0.75rem",
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
                  className="block text-sm font-semibold text-[#1B5E20] mb-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Password
                </label>
                <div className="relative">
                  <span
                    className="absolute pointer-events-none"
                    style={{ left: 12, top: "50%", transform: "translateY(-50%)", color: "#81C784", display: "flex" }}
                  >
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="block w-full text-sm transition-all"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      border: "1px solid #C8E6C9",
                      borderRadius: "0.75rem",
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
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#1B5E20] hover:bg-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E7D32] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? <SpinnerIcon /> : null}
                {submitting ? "Creating account…" : "Continue to Profile Setup"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#C8E6C9]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span
                  className="px-3 bg-white text-[#81C784] font-bold tracking-wider"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Quick Access
                </span>
              </div>
            </div>

            <button
              onClick={handleDemoSignup}
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] hover:bg-[#C8E6C9] transition-all cursor-pointer"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              <span>⚡</span>
              <span>Set up demo profile</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
