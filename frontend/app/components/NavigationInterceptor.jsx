"use client";
import { useEffect } from "react";
import { useApp } from "../context/AppContext";

/**
 * Intercepts clicks on navigation links to /login or /signup
 * and triggers the Bloub transition instead of immediate navigation.
 */
export default function NavigationInterceptor() {
  const { triggerTransition, isTransitioning } = useApp();

  useEffect(() => {
    const handleClick = (e) => {
      // Don't intercept if already transitioning
      if (isTransitioning) return;

      // Find the closest anchor element
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");

      // Intercept navigation to /login or /signup only
      if (href === "/login" || href === "/signup") {
        e.preventDefault();
        e.stopPropagation();
        triggerTransition(href);
      }
    };

    // Use capture phase to intercept before React's synthetic events
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [triggerTransition, isTransitioning]);

  return null;
}
