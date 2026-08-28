"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "../context/AppContext";
import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/chat",         label: "Chat",         icon: "💬", desc: "Agent workspace" },
  { href: "/explore",      label: "Explore",      icon: "🔍", desc: "Browse schemes" },
  { href: "/applications", label: "Applications", icon: "📋", desc: "Track progress" },
  { href: "/documents",    label: "Documents",    icon: "📄", desc: "Manage docs" },
];

export default function DashboardLayout({ children }) {
  const { user, loading, logout, agentState } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (!user.onboardingCompleted) router.push("/onboarding");
    }
  }, [user, loading, router]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (loading || !user || !user.onboardingCompleted) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF8F5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E5E0D8", borderTopColor: "#1B5E20", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 16, fontSize: "0.875rem", color: "#4A5568" }}>Syncing agent workspace...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const bloubSrc =
    agentState === "Surprised"
      ? "/bloub-suprised.svg"
      : `/bloub-${(agentState || "neutral").toLowerCase()}.svg`;
  const agentLabel = { Neutral: "Idle", Attentive: "Listening…", Excited: "Found match!", Confused: "Needs info", Suspicious: "Flagged", Sleepy: "Waiting", Surprised: "Unexpected" }[agentState] || "Idle";

  const Sidebar = ({ onClose }) => (
    <aside style={{ width: 240, minWidth: 240, background: "#fff", borderRight: "1px solid #E5E0D8", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid #F0EDE8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/chat" style={{ fontFamily: "serif", fontWeight: 800, fontSize: "1.5rem", color: "#1B5E20", textDecoration: "none", letterSpacing: "-0.02em" }}>
            hazela
          </Link>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#81C784", lineHeight: 1 }}>✕</button>
          )}
        </div>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A5D6A7" }}>Agent Workspace</span>
      </div>

      {/* Bloub identity */}
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid #F0EDE8", display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div
          className={`bloub bloub-${(agentState || "neutral").toLowerCase()}`}
          style={{ width: 48, height: 48, overflow: "hidden", flexShrink: 0, background: "#F0EDE8" }}
        >
          <img
            src={bloubSrc}
            alt={`Bloub ${agentState}`}
            width={48}
            height={48}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; e.target.parentNode.style.background = "linear-gradient(135deg,#66BB6A,#1B5E20)"; }}
          />
        </div>
        <div>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1B5E20" }}>Bloub</div>
          <div style={{ fontSize: "0.7rem", color: "#81C784", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: agentState === "Suspicious" ? "#C62828" : agentState === "Attentive" ? "#66BB6A" : "#A5D6A7", display: "inline-block" }} />
            {agentLabel}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.75rem", overflowY: "auto" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A0A0A0", padding: "0 0.25rem 0.5rem" }}>Navigation</div>
        {NAV_ITEMS.map(({ href, label, icon, desc }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item${active ? " active" : ""}`}
              style={{ marginBottom: "0.25rem", flexDirection: "column", alignItems: "flex-start", gap: 1 }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%" }}>
                <span style={{ fontSize: "1rem" }}>{icon}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: active ? 700 : 500 }}>{label}</span>
              </span>
              <span style={{ fontSize: "0.7rem", color: active ? "#2E7D32" : "#A0A0A0", paddingLeft: "1.625rem" }}>{desc}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid #F0EDE8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#66BB6A,#1B5E20)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
            {(user.name || "U")[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#061508", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: "0.7rem", color: "#A0A0A0" }}>{user.phone || "Connected"}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.625rem", border: "1px solid #E5E0D8", background: "transparent", color: "#4A5568", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
          onMouseEnter={e => e.target.style.background = "#F0EDE8"}
          onMouseLeave={e => e.target.style.background = "transparent"}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FAF8F5" }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex" style={{ flexShrink: 0, height: "100vh", flexDirection: "column" }}>
        <Sidebar />
      </div>

      {/* Mobile Hamburger Header */}
      <div className="flex md:hidden" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #E5E0D8", height: 56, alignItems: "center", padding: "0 1rem", justifyContent: "space-between" }}>
        <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, padding: 4 }}>
          <span style={{ width: 22, height: 2, background: "#061508", borderRadius: 2, display: "block" }} />
          <span style={{ width: 16, height: 2, background: "#061508", borderRadius: 2, display: "block" }} />
          <span style={{ width: 22, height: 2, background: "#061508", borderRadius: 2, display: "block" }} />
        </button>
        <Link href="/chat" style={{ fontFamily: "serif", fontWeight: 800, fontSize: "1.25rem", color: "#1B5E20", textDecoration: "none" }}>hazela</Link>
        <div className={`bloub bloub-${(agentState || "neutral").toLowerCase()}`} style={{ width: 32, height: 32, overflow: "hidden", background: "#F0EDE8" }}>
          <img src={bloubSrc} alt="Bloub" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; e.target.parentNode.style.background = "linear-gradient(135deg,#66BB6A,#1B5E20)"; }} />
        </div>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setDrawerOpen(false)} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 50, display: "flex", flexDirection: "column" }}>
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Mobile top spacer */}
        <div className="flex md:hidden" style={{ height: 56, flexShrink: 0 }} />
        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
