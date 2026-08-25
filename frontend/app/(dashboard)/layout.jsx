"use client";
import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.onboardingCompleted) {
        router.push("/onboarding");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !user.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-paper-200 flex flex-col justify-center items-center font-body">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-ink-600">Syncing with agent workspace...</p>
      </div>
    );
  }

  // Navigation link helper
  const isTabActive = (path) => pathname === path;
  const navLinkClass = (path) => 
    `font-body text-sm font-semibold transition-all px-3 py-1.5 rounded-full ${
      isTabActive(path) 
        ? "bg-amber-100 text-amber-700" 
        : "text-ink-600 hover:text-ink-950 hover:bg-paper-300"
    }`;

  return (
    <div className="min-h-screen bg-paper-200 flex flex-col">
      {/* Editorial Dashboard Top Bar */}
      <header className="sticky top-0 z-40 bg-paper-50/90 backdrop-blur-md border-b border-ink-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a href="/chat" className="font-display font-bold text-2xl text-ink-950 tracking-tight">
              hazela
            </a>
            <span className="hidden sm:inline-block h-4 w-px bg-ink-200"></span>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-ink-400 font-body">
              Agent Workspace
            </span>
          </div>

          {/* Center Tabs - Desktop */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="/chat" className={navLinkClass("/chat")}>Chat</a>
            <a href="/explore" className={navLinkClass("/explore")}>Explore</a>
            <a href="/applications" className={navLinkClass("/applications")}>Applications</a>
            <a href="/documents" className={navLinkClass("/documents")}>Documents</a>
          </nav>

          {/* User Profile dropdown/status */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-ink-800 font-body">{user.name}</span>
              <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1 font-body">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Agent Idle
              </span>
            </div>
            
            <button
              onClick={logout}
              className="text-xs font-semibold text-ink-500 hover:text-ink-950 border border-ink-200 hover:bg-paper-300 px-3 py-1.5 rounded-full transition-all font-body cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
