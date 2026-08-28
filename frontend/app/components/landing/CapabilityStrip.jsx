"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Mic,
  Sparkles,
  Zap,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

/* ─── Discovery Animation ────────────────────────────────────────────────── */

function DiscoveryVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2000),
      setTimeout(() => setStep(4), 2800),
    ];
    const loop = setTimeout(() => setStep(0), 5000);
    return () => { timers.forEach(clearTimeout); clearTimeout(loop); };
  }, [step === 0]);

  const profile = ["Maharashtra", "College student", "Income below ₹3L", "OBC category"];
  const schemes = [
    { name: "AICTE Pragati Scholarship", match: 97 },
    { name: "Post-Matric Scholarship", match: 94 },
    { name: "Rajarshi Shahu Merit Award", match: 88 },
  ];

  return (
    <div className="mt-4 space-y-3">
      {/* Profile info */}
      <div className="flex flex-wrap gap-1.5">
        {profile.map((item, i) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#061508] border border-[#2E7D32]/30 px-2.5 py-1 text-[0.7rem] font-medium text-[#A5D6A7]"
            style={{ opacity: step >= 1 ? 1 : 0.3, transition: `opacity 0.4s ${i * 0.1}s` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
            {item}
          </span>
        ))}
      </div>

      {/* Schemes appear */}
      {step >= 2 && schemes.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center justify-between rounded-xl bg-[#F3EFE9] px-3 py-2 border border-[#E5DFD5]"
        >
          <span className="text-[0.75rem] font-medium text-[#061508]">{s.name}</span>
          <span className="text-[0.7rem] font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded-full">
            {s.match}%
          </span>
        </motion.div>
      ))}

      {step >= 4 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[0.7rem] text-[#2A3B2D] font-medium text-center pt-1"
        >
          Top match highlighted — 97% profile fit
        </motion.p>
      )}
    </div>
  );
}

/* ─── Eligibility Metrics ─────────────────────────────────────────────────── */

function EligibilityVisual() {
  const metrics = [
    { label: "Profile Match", value: 97, icon: <Zap className="h-3.5 w-3.5 text-[#2E7D32]" /> },
    { label: "Document Readiness", value: 85, icon: <CheckCircle2 className="h-3.5 w-3.5 text-[#2E7D32]" /> },
    { label: "Time Saved", value: 92, icon: <Sparkles className="h-3.5 w-3.5 text-[#2E7D32]" /> },
  ];

  return (
    <div className="mt-4 space-y-3">
      {metrics.map((m, i) => (
        <div key={m.label} className="space-y-1.5 rounded-xl bg-[#F3EFE9] p-2.5 border border-[#E5DFD5]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-[#061508]">
              {m.icon}
              {m.label}
            </div>
            <div className="text-[#2E7D32] font-bold">{m.value}%</div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5DFD5]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${m.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Verification Shield Animation ───────────────────────────────────────── */

function VerificationVisual() {
  const [phase, setPhase] = useState(0);
  const [value, setValue] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    // Cycle: 0→100 shield, hold, then reset
    let mounted = true;

    const runCycle = () => {
      if (!mounted) return;
      setPhase(0);
      setValue(0);

      // Animate value 0 → 100 over 3.5s
      const duration = 3500;
      const start = performance.now();

      const tick = (now) => {
        if (!mounted) return;
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * 100));

        if (progress < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          // Hold green verified state
          setPhase(1);
          animRef.current = setTimeout(() => {
            if (mounted) runCycle();
          }, 4000);
        }
      };

      animRef.current = requestAnimationFrame(tick);
    };

    // Initial delay
    const init = setTimeout(() => runCycle(), 600);

    return () => {
      mounted = false;
      clearTimeout(init);
      if (animRef.current) {
        if (typeof animRef.current === "number") cancelAnimationFrame(animRef.current);
        else clearTimeout(animRef.current);
      }
    };
  }, []);

  // Shield color: red < 30, yellow 30-79, green >= 80
  const shieldColor =
    value < 30 ? "#D32F2F" : value < 80 ? "#F9A825" : "#2E7D32";

  const shieldBg =
    value < 30 ? "rgba(211,47,47,0.12)" : value < 80 ? "rgba(249,168,37,0.12)" : "rgba(46,125,50,0.12)";

  const statusLabel =
    value < 30 ? "Unverified" : value < 80 ? "Checking sources…" : "Verified";

  const statusSubtext =
    value < 30 ? "Source not yet checked" :
    value < 80 ? "Cross-referencing official portals" :
    "All checks passed — authentic source";

  const isVerified = phase === 1 && value === 100;

  return (
    <div className="mt-4 rounded-xl bg-[#F3EFE9] p-4 border border-[#E5DFD5]">
      {/* Shield + percentage */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className="flex items-center justify-center rounded-full transition-colors duration-500"
          style={{ width: 52, height: 52, background: shieldBg }}
        >
          {/* Shield SVG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ transition: "all 0.4s ease" }}>
            <path
              d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
              fill={shieldColor}
              opacity={0.15}
              stroke={shieldColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
              style={{ transition: "all 0.4s ease" }}
            />
            {isVerified && (
              <polyline
                points="8,12 11,15 16,9"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            {!isVerified && value > 0 && (
              <circle
                cx="12" cy="12" r="3"
                fill={shieldColor}
                opacity={0.6}
                style={{ transition: "all 0.4s ease" }}
              />
            )}
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: shieldColor, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', transition: "color 0.4s ease" }}>
            {value}%
          </p>
          <p className="text-[0.7rem] font-semibold" style={{ color: "#061508", fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
            {statusLabel}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5DFD5] mb-3">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${value}%`,
            background: shieldColor,
          }}
        />
      </div>

      {/* Status text */}
      <p className="text-[0.7rem] font-medium" style={{ color: "#2A3B2D", fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
        {statusSubtext}
      </p>
    </div>
  );
}

/* ─── Voice Demo ──────────────────────────────────────────────────────────── */

function VoiceVisual() {
  const [submitted, setSubmitted] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    let id;
    if (submitted) id = setInterval(() => setTime(t => t + 1), 1000);
    else setTime(0);
    return () => clearInterval(id);
  }, [submitted]);

  useEffect(() => {
    if (!isDemo) return;
    let t;
    const run = () => {
      setSubmitted(true);
      t = setTimeout(() => { setSubmitted(false); t = setTimeout(run, 1200); }, 3200);
    };
    const init = setTimeout(run, 200);
    return () => { clearTimeout(t); clearTimeout(init); };
  }, [isDemo]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleClick = () => {
    if (isDemo) { setIsDemo(false); setSubmitted(false); }
    else setSubmitted(p => !p);
  };

  return (
    <div className="w-full mt-4 rounded-2xl bg-[#F3EFE9] p-4 border border-[#E5DFD5]">
      <div className="relative mx-auto flex w-full flex-col items-center gap-2">
        <button
          className={`group flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
            submitted
              ? "bg-[#2E7D32] shadow-md shadow-[#2E7D32]/30 scale-105"
              : "bg-white border border-[#E5DFD5] hover:bg-white/80 hover:border-[#2E7D32]/40 hover:scale-105"
          }`}
          onClick={handleClick}
          type="button"
        >
          {submitted ? (
            <div className="h-3.5 w-3.5 animate-ping rounded-full bg-white" />
          ) : (
            <Mic className="h-5 w-5 text-[#2E7D32]" />
          )}
        </button>
        <span className="font-mono text-xs text-[#2E7D32] font-semibold">{formatTime(time)}</span>
        <div className="flex h-4 w-48 items-center justify-center gap-1">
          {[...Array(24)].map((_, i) => (
            <div
              className={`w-1 rounded-full transition-all duration-300 ${submitted ? "bg-[#2E7D32]" : "h-1 bg-[#D5CDC0]"}`}
              key={i}
              style={submitted && isClient ? { height: `${25 + Math.sin(i * 0.5) * 60 + Math.random() * 20}%`, animationDelay: `${i * 0.04}s` } : undefined}
            />
          ))}
        </div>
        <p className="text-xs text-[#2A3B2D] font-medium">
          {submitted ? "Listening to your scheme query…" : "Tap mic to test live voice query"}
        </p>
      </div>
    </div>
  );
}

/* ─── Bento Card ──────────────────────────────────────────────────────────── */

const BentoCard = ({ item }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width - 0.5;
    const yPct = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function handleMouseLeave() { x.set(0); y.set(0); }

  const isDark = item.theme === "dark";

  return (
    <motion.div
      className="h-full"
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      variants={fadeInUp}
      whileHover={{ y: -4 }}
    >
      <Link
        aria-label={`${item.title} - ${item.description}`}
        className={`group relative flex h-full flex-col justify-between rounded-3xl border p-6 transition-all duration-300 ${
          isDark
            ? "border-[#2E7D32]/30 bg-gradient-to-br from-[#061508] via-[#0A270D] to-[#061508] shadow-[0_12px_36px_rgba(6,21,8,0.25)] hover:border-[#4CAF50]/40"
            : "border-[#E5DFD5] bg-[#FFFFFF] shadow-[0_6px_24px_rgba(6,21,8,0.04)] hover:border-[#D5CDC0] hover:shadow-[0_12px_32px_rgba(6,21,8,0.08)]"
        } ${item.className || ""}`}
        href={item.href || "#"}
      >
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3
                className={`font-bold text-lg md:text-xl tracking-tight ${isDark ? "text-[#FFFFFF]" : "text-[#061508]"}`}
                style={{ fontFamily: 'Syne, sans-serif', textTransform: 'lowercase' }}
              >
                {item.title}
              </h3>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                isDark ? "bg-white/10 text-[#A5D6A7] group-hover:bg-[#2E7D32]" : "bg-[#F3EFE9] text-[#2E7D32] group-hover:bg-[#2E7D32] group-hover:text-white"
              }`}>
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? "text-[#D5CDC0]" : "text-[#2A3B2D]"}`}>
              {item.description}
            </p>
            {item.visual}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────────── */

const bentoItems = [
  {
    id: "find",
    title: "Instant Scheme Discovery",
    description: "Tell your agent about your situation. It matches your profile across central and state portals in seconds.",
    href: "#how-it-works",
    theme: "dark",
    visual: <DiscoveryVisual />,
    size: "lg",
    className: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    id: "eligibility",
    title: "Real-Time Eligibility",
    description: "Understand why you qualify without deciphering complicated government circulars.",
    href: "#how-it-works",
    theme: "light",
    visual: <EligibilityVisual />,
    size: "md",
    className: "col-span-1 md:col-span-1 row-span-1",
  },
  {
    id: "verification",
    title: "Official Source Verification",
    description: "Every opportunity is cross-checked against official .gov.in domains and portals before you apply.",
    href: "#trust",
    theme: "light",
    visual: <VerificationVisual />,
    size: "md",
    className: "col-span-1 md:col-span-1 row-span-1",
  },
  {
    id: "voice",
    title: "Voice & Phone Assistant",
    description: "Interact with Hazela using natural voice. Check eligibility, listen to requirements, and get step-by-step guidance.",
    href: "#phone-access",
    theme: "light",
    visual: <VoiceVisual />,
    size: "md",
    className: "col-span-1 md:col-span-1 row-span-1",
  },
];

export default function CapabilityStrip() {
  return (
    <section
      id="what-you-can-do"
      className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#F3EFE9" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#061508] px-3.5 py-1 text-xs font-semibold text-[#A5D6A7] border border-[#2E7D32]/30 uppercase tracking-widest mb-4">
            ✦ Core Capabilities
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#061508] tracking-tight mb-4"
            style={{ fontFamily: 'Syne, sans-serif', textTransform: 'lowercase' }}
          >
            More than finding a scheme.
          </h2>
          <p className="text-[#2A3B2D] text-base md:text-lg max-w-xl mx-auto">
            Everything your agent handles — from discovery to eligibility, verification, and voice access.
          </p>
        </div>

        {/* Bento Grid */}
        <motion.div
          className="grid gap-5"
          initial="hidden"
          variants={staggerContainer}
          viewport={{ once: true }}
          whileInView="visible"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <motion.div className="md:col-span-2" variants={fadeInUp}>
              <BentoCard item={bentoItems[0]} />
            </motion.div>
            <motion.div className="md:col-span-1" variants={fadeInUp}>
              <BentoCard item={bentoItems[1]} />
            </motion.div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <motion.div className="md:col-span-1" variants={fadeInUp}>
              <BentoCard item={bentoItems[2]} />
            </motion.div>
            <motion.div className="md:col-span-1" variants={fadeInUp}>
              <BentoCard item={bentoItems[3]} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
