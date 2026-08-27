"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Mic,
  Plus,
  Sparkles,
  Zap,
  Search,
  ShieldCheck,
  FileText,
  Bell,
  HelpCircle,
  PhoneCall
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const bentoItems = [
  {
    id: "find",
    title: "Instant Scheme Discovery",
    description:
      "Tell your agent about your situation. It matches your profile across central and state portals in seconds.",
    href: "#how-it-works",
    feature: "spotlight",
    theme: "dark",
    spotlightItems: [
      "Income & category matching",
      "State domicile verification",
      "Course & college eligibility",
      "Merit & quota detection",
    ],
    size: "lg",
    className: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    id: "metrics",
    title: "Real-Time Eligibility Metrics",
    description:
      "Understand why you qualify without deciphering complicated government circulars.",
    href: "#how-it-works",
    feature: "metrics",
    theme: "light",
    metrics: [
      { label: "Profile Match", value: 97, suffix: "%", color: "emerald" },
      { label: "Document Readiness", value: 85, suffix: "%", color: "emerald" },
      { label: "Time Saved", value: 92, suffix: "%", color: "emerald" },
    ],
    size: "md",
    className: "col-span-1 md:col-span-1 row-span-1",
  },
  {
    id: "legitimacy",
    title: "Official Source Verification",
    description:
      "Every opportunity is cross-checked against official .gov.in domains and portals before you apply.",
    href: "#trust",
    feature: "counter",
    theme: "light",
    statistic: {
      start: 0,
      end: 100,
      suffix: "% Official",
      label: "Authenticity Checked",
    },
    size: "md",
    className: "col-span-1 md:col-span-1 row-span-1",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const SpotlightFeature = ({ items }) => (
  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
    {items.map((item, index) => (
      <motion.li
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3 py-2"
        initial={{ opacity: 0, x: -10 }}
        key={`spotlight-${item.toLowerCase().replace(/\s+/g, "-")}`}
        transition={{ delay: 0.1 * index }}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2E7D32]/40 text-[#A5D6A7]">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <span className="text-[#E8F5E9] text-xs font-medium tracking-wide">
          {item}
        </span>
      </motion.li>
    ))}
  </ul>
);

const CounterAnimation = ({
  start,
  end,
  suffix = "",
}) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    const duration = 2000;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easedProgress;

      setCount(Math.min(current, end));

      if (currentFrame === totalFrames) {
        clearInterval(counter);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [start, end]);

  return (
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F3EFE9] p-4 border border-[#E5DFD5]">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#2E7D32] font-bold mb-1">
          Verification Rate
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-3xl text-[#061508]">
            {count.toFixed(0)}
          </span>
          <span className="font-semibold text-[#2E7D32] text-lg">
            {suffix}
          </span>
        </div>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20">
        <ShieldCheck className="h-6 w-6" />
      </div>
    </div>
  );
};

const MetricsFeature = ({ metrics }) => {
  return (
    <div className="mt-4 space-y-3">
      {metrics.map((metric, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5 rounded-xl bg-[#F3EFE9] p-2.5 border border-[#E5DFD5]"
          initial={{ opacity: 0, y: 10 }}
          key={`metric-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
          transition={{ delay: 0.15 * index }}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-[#061508]">
              {metric.label === "Profile Match" && <Zap className="h-3.5 w-3.5 text-[#2E7D32]" />}
              {metric.label === "Document Readiness" && <Clock className="h-3.5 w-3.5 text-[#2E7D32]" />}
              {metric.label === "Time Saved" && <Sparkles className="h-3.5 w-3.5 text-[#2E7D32]" />}
              {metric.label}
            </div>
            <div className="text-[#2E7D32] font-bold">
              {metric.value}
              {metric.suffix}
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5DFD5]">
            <motion.div
              animate={{
                width: `${Math.min(100, metric.value)}%`,
              }}
              className="h-full rounded-full bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]"
              initial={{ width: 0 }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
                delay: 0.15 * index,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

function AIInput_Voice() {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let intervalId;

    if (submitted) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1200);
      }, 3200);
    };

    const initialTimeout = setTimeout(runAnimation, 200);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo]);

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
    } else {
      setSubmitted((prev) => !prev);
    }
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

        <span className="font-mono text-xs text-[#2E7D32] font-semibold">
          {formatTime(time)}
        </span>

        <div className="flex h-4 w-48 items-center justify-center gap-1">
          {[...Array(24)].map((_, i) => (
            <div
              className={`w-1 rounded-full transition-all duration-300 ${
                submitted ? "bg-[#2E7D32]" : "h-1 bg-[#D5CDC0]"
              }`}
              key={`voice-bar-${i}`}
              style={
                submitted && isClient
                  ? {
                      height: `${25 + Math.sin(i * 0.5) * 60 + Math.random() * 20}%`,
                      animationDelay: `${i * 0.04}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="text-xs text-[#2A3B2D] font-medium">
          {submitted ? "Listening to your scheme query..." : "Tap mic to test live voice query"}
        </p>
      </div>
    </div>
  );
}

const BentoCard = ({ item }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 100);
    y.set(yPct * 100);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const isDark = item.theme === "dark";

  return (
    <motion.div
      className="h-full"
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
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
                className={`font-bold text-lg md:text-xl tracking-tight ${
                  isDark ? "text-[#FFFFFF]" : "text-[#061508]"
                }`}
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

            <p className={`text-sm leading-relaxed ${
              isDark ? "text-[#D5CDC0]" : "text-[#2A3B2D]"
            }`}>
              {item.description}
            </p>

            {item.feature === "spotlight" && item.spotlightItems && (
              <SpotlightFeature items={item.spotlightItems} />
            )}

            {item.feature === "counter" && item.statistic && (
              <div className="mt-auto pt-2">
                <CounterAnimation
                  end={item.statistic.end || 100}
                  start={item.statistic.start || 0}
                  suffix={item.statistic.suffix}
                />
              </div>
            )}

            {item.feature === "metrics" && item.metrics && (
              <MetricsFeature metrics={item.metrics} />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

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
            Everything your agent handles — from eligibility calculation to conversational queries and voice access.
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
            <motion.div
              className="overflow-hidden rounded-3xl border border-[#E5DFD5] bg-[#FFFFFF] p-6 shadow-[0_6px_24px_rgba(6,21,8,0.04)] transition-all duration-300 hover:border-[#D5CDC0] hover:shadow-[0_12px_32px_rgba(6,21,8,0.08)] md:col-span-1 flex flex-col justify-between"
              variants={fadeInUp}
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 
                    className="font-bold text-[#061508] text-lg md:text-xl tracking-tight"
                    style={{ fontFamily: 'Syne, sans-serif', textTransform: 'lowercase' }}
                  >
                    Voice & Phone Assistant
                  </h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EFE9] text-[#2E7D32]">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[#2A3B2D] text-sm leading-relaxed">
                  Interact with Hazela using natural voice. Check eligibility, listen to requirements, and get step-by-step guidance.
                </p>
              </div>
              <AIInput_Voice />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
