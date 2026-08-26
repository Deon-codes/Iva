"use client";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function SignupPage() {
  const { signup } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(name, phone);
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
        <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl border border-[#C8E6C9] overflow-hidden">
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
              className="text-center md:text-left text-sm text-[#2E7D32] mb-8"
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

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-[#1B5E20] mb-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#C8E6C9] rounded-xl text-[#0A270D] text-sm bg-white placeholder-[#A5D6A7] focus:outline-none focus:ring-2 focus:ring-[#66BB6A] focus:border-[#66BB6A] transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-[#1B5E20] mb-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#C8E6C9] rounded-xl text-[#0A270D] text-sm bg-white placeholder-[#A5D6A7] focus:outline-none focus:ring-2 focus:ring-[#66BB6A] focus:border-[#66BB6A] transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#1B5E20] hover:bg-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E7D32] transition-all cursor-pointer shadow-md"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Continue to Profile Setup
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
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
              onClick={() => signup("Aarav Sharma", "+91 98765 43210")}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] hover:bg-[#C8E6C9] transition-all cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>⚡</span>
              <span>Set up demo profile</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
