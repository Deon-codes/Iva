"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const SOURCES = [
  "National Scholarship Portal",
  "PM YASASVI",
  "Post-Matric Scholarship",
  "State Education Boards",
  "AICTE Schemes",
  "Ministry of Education",
  "Minority Affairs",
  "SC/ST Scholarship Portal",
  "OBC Welfare Schemes",
  "DigiLocker Verified",
  "UGC Fellowships",
  "District Welfare Offices",
  "Skill India Missions",
  "State Government Portals",
];

const SEPARATOR = "   ✦   ";
const FONT_SIZE = 200;
const W = 12000;

// Broad smooth arc
const MARQUEE_PATH = `M 0 140 C ${W * 0.35} 20, ${W * 0.65} 20, ${W} 140`;

// One complete text unit (all sources with trailing separator)
const ONE_UNIT = SOURCES.map((s) => s + SEPARATOR).join("");

// Enough raw repetitions for initial measurement
const RAW_REPETITIONS = 12;
const RAW_TEXT = Array(RAW_REPETITIONS).fill(ONE_UNIT).join("");

const SECTION_STYLE = {
  padding: "2rem 0 2.5rem",
  background: "linear-gradient(180deg, #061508 0%, #0A270D 100%)",
  overflow: "hidden",
  position: "relative",
};

export default function SchemeSourceMarquee() {
  const textPathRef = useRef(null);
  const pathRef = useRef(null);
  const [displayText, setDisplayText] = useState(RAW_TEXT);
  const [ready, setReady] = useState(false);

  // Phase 1: measure one unit length, build exact repetitions
  useEffect(() => {
    if (!textPathRef.current || !pathRef.current) return;

    const pathEl = pathRef.current;
    const pathLength = pathEl.getTotalLength();
    const unitLength =
      textPathRef.current.getComputedTextLength() / RAW_REPETITIONS;
    const repeatsNeeded = Math.ceil(pathLength / unitLength) + 1;
    const finalText = Array(repeatsNeeded).fill(ONE_UNIT).join("");

    setDisplayText(finalText);
    setReady(true);

    // Store computed values for the animation phase
    textPathRef.current.dataset.pathLength = String(pathLength);
    textPathRef.current.dataset.unitLength = String(unitLength);
  }, []);

  // Phase 2: animate by exactly one unit length for seamless loop
  useEffect(() => {
    if (!ready || !textPathRef.current) return;

    const id = requestAnimationFrame(() => {
      const el = textPathRef.current;
      if (!el) return;

      const pathLength = parseFloat(el.dataset.pathLength);
      const unitLength = parseFloat(el.dataset.unitLength);

      if (!pathLength || !unitLength) return;

      // Convert unit length to percentage of total path
      const unitPercent = (unitLength / pathLength) * 100;

      // Animate by exactly one unit — when it loops, the next identical unit
      // occupies the exact same position the first unit did = seamless
      gsap.fromTo(
        el,
        { attr: { startOffset: "0%" } },
        {
          attr: { startOffset: "-" + unitPercent + "%" },
          duration: 60,
          ease: "none",
          repeat: -1,
        }
      );
    });

    return () => cancelAnimationFrame(id);
  }, [ready]);

  return (
    <section style={SECTION_STYLE}>
      {/* Top fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40px",
          background: "linear-gradient(180deg, #061508 0%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Caption */}
      <p
        style={{
          textAlign: "center",
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontWeight: 500,
          fontSize: "0.9rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4CAF50",
          marginBottom: "0.75rem",
          opacity: 1,
        }}
      >
        Checks against official government sources
      </p>

      {/* Curved textPath marquee */}
      <div
        style={{
          overflow: "hidden",
          maskImage:
            "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)",
        }}
      >
        <svg
          viewBox={"0 0 " + W + " 180"}
          style={{
            width: "100%",
            height: "140px",
            display: "block",
          }}
          aria-hidden="true"
        >
          <defs>
            <path ref={pathRef} id="measurePath" d={MARQUEE_PATH} fill="none" />
          </defs>

          {/* Single continuous text along the curved path */}
          <text
            fontFamily='"Plus Jakarta Sans", system-ui, sans-serif'
            fontWeight="500"
            fontSize={FONT_SIZE}
            fill="#D5CDC0"
          >
            <textPath
              ref={textPathRef}
              href="#measurePath"
              startOffset="0%"
            >
              {displayText}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40px",
          background: "linear-gradient(0deg, #0A270D 0%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
