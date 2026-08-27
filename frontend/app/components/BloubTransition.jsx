"use client";
import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

/**
 * Full-screen Bloub transition overlay.
 * Shows bloub-my-cycle.gif prominently, then navigates to the target.
 * Feels like entering the agent — not a loading spinner.
 */

// Fixed duration matching the actual bloub-my-cycle.gif asset length.
// HTML <img> elements do not expose a .duration property for GIFs,
// so we use the known intended duration rather than unreliable detection.
const GIF_DURATION_MS = 6000;
const EXIT_FADE_MS = 0;

export default function BloubTransition() {
  const { isTransitioning, completeTransition } = useApp();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (isTransitioning) {
      setVisible(true);
      setExiting(false);
      completedRef.current = false;

      // Wait for the full GIF duration, then begin exit fade
      timerRef.current = setTimeout(() => {
        setExiting(true);
        // Complete navigation after fade finishes
        timerRef.current = setTimeout(() => {
          if (!completedRef.current) {
            completedRef.current = true;
            completeTransition();
          }
        }, EXIT_FADE_MS);
      }, GIF_DURATION_MS);
    } else {
      // Transition ended or wasn't active — fully remove overlay
      setVisible(false);
      setExiting(false);
      completedRef.current = false;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTransitioning, completeTransition]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#E8F5E9",
        opacity: exiting ? 0 : 1,
        transition: `opacity ${EXIT_FADE_MS}ms ease-out`,
        // Block all pointer events during the active transition to prevent
        // duplicate navigation. The overlay is removed entirely once
        // isTransitioning becomes false, so nothing leaks.
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Subtle radial gradient for depth */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 40%, rgba(102,187,106,0.15) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Bloub GIF */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <img
          src="/bloub-my-cycle.gif"
          alt="Entering agent workspace"
          style={{
            width: "min(280px, 60vw)",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 8px 32px rgba(27,94,32,0.2))",
          }}
          onError={(e) => {
            // Fallback to SVG if GIF fails to load
            e.target.src = "/bloub-neutral.svg";
          }}
        />
      </div>
    </div>
  );
}
