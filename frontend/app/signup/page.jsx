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
    <main className="min-h-screen bg-paper-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gradient matches landing style */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_10%,rgba(198,132,31,0.04),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(35,43,69,0.03),transparent_40%)]"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <a
          href="/"
          className="text-center block font-display font-bold text-3xl text-ink-950 hover:opacity-85 transition-opacity"
        >
          hazela
        </a>
        <h2 className="mt-6 text-center font-display font-bold text-2xl text-ink-950">
          Create your profile workspace
        </h2>
        <p className="mt-2 text-center text-sm text-ink-600 font-body">
          Or{" "}
          <a href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
            sign in to your existing workspace
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-paper-50 py-8 px-6 shadow-md rounded-xl border border-ink-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-ink-700 font-body">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm placeholder-ink-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-ink-950 text-sm font-body bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-ink-700 font-body">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm placeholder-ink-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-ink-950 text-sm font-body bg-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 font-body transition-colors cursor-pointer"
              >
                Continue to Profile Setup
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-paper-50 text-ink-400 font-semibold font-body">
                  Quick Access
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => signup("Aarav Sharma", "+91 98765 43210")}
                className="w-full flex justify-center items-center py-2 px-4 border border-ink-200 rounded-md shadow-sm text-sm font-semibold text-ink-700 bg-paper-100 hover:bg-paper-200 focus:outline-none font-body transition-colors cursor-pointer"
              >
                ⚡ Set up demo profile (Aarav Sharma)
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
