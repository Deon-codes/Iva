"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { SlideTabs } from "../ui/slide-tabs";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionIds = useRef(["#how-it-works", "#what-you-can-do", "#trust"]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Track which section is visible and update active tab */
  useEffect(() => {
    const targets = sectionIds.current
      .map((id) => document.querySelector(id))
      .filter(Boolean);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = targets.indexOf(entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = href;
    }
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: scrolled ? "0.75rem" : "1.25rem",
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        padding: "0 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          height: "64px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          background: "rgba(6, 21, 8, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "9999px",
          border: "1px solid rgba(165, 214, 167, 0.15)",
          padding: "0 2rem",
          boxShadow: "0 10px 30px -10px rgba(6, 21, 8, 0.4)",
        }}
      >
        {/* Left: Wordmark logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <a
            href="/"
            style={{
              fontFamily: 'Syne, sans-serif',
              textTransform: "lowercase",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#F3EFE9",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            Iva
          </a>
        </div>

        {/* Center: SlideTabs */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SlideTabs
            tabs={[
              { label: "How it works", href: "#how-it-works" },
              { label: "What you can do", href: "#what-you-can-do" },
              { label: "Why Iva", href: "#trust" },
            ]}
            activeIndex={activeIndex}
            onTabSelect={(tab) => scrollToSection(tab.href)}
          />
        </div>

        {/* Right: Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", justifyContent: "flex-end" }}>
          <a
            href="/login"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "#D5CDC0",
              textDecoration: "none",
              transition: "color 0.2s",
              padding: "0.5rem 1rem",
            }}
            onMouseEnter={e => (e.target.style.color = "#F3EFE9")}
            onMouseLeave={e => (e.target.style.color = "#D5CDC0")}
          >
            Sign In
          </a>
          <a
            href="/signup"
            style={{
              background: "#2E7D32",
              color: "#fff",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: "0.9375rem",
              padding: "0.625rem 1.375rem",
              borderRadius: "9999px",
              textDecoration: "none",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => {
              e.target.style.background = "#2A3B2D";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.target.style.background = "#2E7D32";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
