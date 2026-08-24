# Landing Page Design System

**Product:** Agentic government schemes & scholarships platform
**Core promise:** "Don't spend hours chasing government applications. Let your agent handle the process."
**Journey:** DISCOVER → CHECK → PREPARE → APPLY → TRACK

This document defines the visual and interaction language for the landing page. It combines the interaction patterns proven on modern AI-product sites (studied from Jasper.ai — typography scale, logo marquee motion, and the auto-cycling feature showcase) with content and tone specific to our product. **Nothing here should read as a scholarship directory or a generic SaaS clone.** The product is an agent that *does the work*, in a domain (government paperwork) where trust, clarity, and calm confidence matter more than AI hype.

---

## 1. Design Principles

- **Trustworthy before impressive.** This handles income data, IDs, and government submissions. Every design decision should reduce anxiety, not manufacture excitement.
- **Editorial, not corporate-SaaS.** Serif display type, generous whitespace, restrained color — closer to a well-designed publication than a dashboard.
- **Agentic, not chatty.** Visuals should show *work happening* (documents matched, status updates, applications moving) — never a chat bubble UI.
- **Student-friendly.** Plain language, short sentences, no jargon, no technical implementation details visible anywhere (no "AI agent architecture," no "RAG," no "Gemini").
- **Calm motion.** Animations communicate progress, not spectacle. Nothing should feel like a demo reel.

---

## 2. Typography

| Role | Treatment |
|---|---|
| Display / H1 (hero, section headers) | High-contrast serif (Times New Roman-family, matching existing project typography) — large scale, tight tracking, sets the editorial tone the way Jasper uses its serif display face for headlines |
| Body / UI text | Clean grotesk sans-serif, 16–18px base, 1.4–1.5 line height, for readability on dense explanatory copy |
| Micro-labels (step numbers, status tags, badges) | Sans-serif, small caps or uppercase, wide tracking, low visual weight |

Rule of thumb: **serif for promise and reassurance** (headlines, "Your next opportunity shouldn't be lost in paperwork"), **sans for mechanism and detail** (step descriptions, feature copy, status feed).

---

## 3. Design Tokens

Structured the same way as the reference site's token system (50→950 scales + semantic intents + spacing/radius/shadow scales), but with **our own hues** — Jasper's blue/bright-green brand palette is not reused anywhere. Our palette trades marketing-energy blue/green for a warm-paper-and-ink system suited to a government-trust product.

### 3.1 Color Scales

**Primary — Ink (headlines, primary text, nav)**

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#F6F7FA` | `--color-primary-50` |
| 100 | `#ECEEF3` | `--color-primary-100` |
| 200 | `#D3D7E3` | `--color-primary-200` |
| 300 | `#A7AFC6` | `--color-primary-300` |
| 400 | `#7580A0` | `--color-primary-400` |
| 500 | `#4C577A` | `--color-primary-500` |
| 600 | `#333D5C` | `--color-primary-600` |
| 700 | `#232B45` | `--color-primary-700` |
| 800 | `#161B2E` | `--color-primary-800` |
| 900 | `#0F1322` | `--color-primary-900` |
| 950 | `#0B1220` | `--color-primary-950` — **this is `--ink`, used for headline type** |

**Neutral — Paper (backgrounds, surfaces)**

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#FFFFFF` | `--color-neutral-50` |
| 100 | `#FCFAF6` | `--color-neutral-100` |
| 200 | `#FAF8F4` | `--color-neutral-200` — **this is `--paper`, the default page background** |
| 300 | `#F1EDE4` | `--color-neutral-300` |
| 400 | `#E4DDCF` | `--color-neutral-400` |
| 500 | `#CFC6B4` | `--color-neutral-500` |
| 600 | `#B0A48D` | `--color-neutral-600` |
| 700 | `#8C816C` | `--color-neutral-700` |
| 800 | `#635A49` | `--color-neutral-800` |
| 900 | `#3D372C` | `--color-neutral-900` |
| 950 | `#241F19` | `--color-neutral-950` |

**Accent — Amber (single accent: primary CTA, active states, progress bars)**

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#FFF8EC` | `--color-accent-50` |
| 100 | `#FEEFD2` | `--color-accent-100` |
| 200 | `#FCDCA0` | `--color-accent-200` |
| 300 | `#F8C266` | `--color-accent-300` |
| 400 | `#F0A83C` | `--color-accent-400` |
| 500 | `#C6841F` | `--color-accent-500` — **primary CTA fill** |
| 600 | `#A66A16` | `--color-accent-600` — CTA hover/pressed |
| 700 | `#825213` | `--color-accent-700` |
| 800 | `#5E3B10` | `--color-accent-800` |
| 900 | `#3D260B` | `--color-accent-900` |
| 950 | `#241608` | `--color-accent-950` |

Used sparingly and only where it means "act here" — CTA buttons, active step indicator, progress underline. Never as decorative fill.

### 3.2 Semantic Intents (status feed, §4.6)

| Intent | Hex | Token Variable | Use |
|--------|-----|----------------|-----|
| Success | `#4B7A5E` | `--color-success` | "Application submitted," checkmarks |
| Pending | `#C6841F` (= `--color-accent-500`) | `--color-pending` | "Waiting for department response" |
| Attention | `#B4543D` | `--color-attention` | "Action required" — muted rust, never alarm-red |
| Line | `#D3D7E3` (= `--color-primary-200`) | `--color-line` | Hairline dividers/grid, used sparingly |

Color is used functionally (status states, CTA) far more than decoratively. No gradients, no glassmorphism.

### 3.3 Typography Scale

**Font families**
- **Display (headings):** serif — Times New Roman family / project's existing editorial serif
- **Body/UI:** clean grotesk sans-serif (system-ui stack or existing project sans)
- **Mono (status codes, reference numbers if ever needed):** system monospace

**Font sizes**

| Scale | Value | Token Variable |
|-------|-------|----------------|
| xs | `0.8125rem` | `--font-size-xs` |
| sm | `0.9375rem` | `--font-size-sm` |
| base | `1.0625rem` | `--font-size-base` |
| lg | `1.25rem` | `--font-size-lg` |
| xl | `1.625rem` | `--font-size-xl` |
| 2xl | `2.125rem` | `--font-size-2xl` |
| 3xl | `2.75rem` | `--font-size-3xl` |
| 4xl | `3.5rem` | `--font-size-4xl` — hero headline only |

**Font weights**

| Name | Weight | Token Variable |
|------|--------|----------------|
| normal | `400` | `--font-weight-normal` |
| medium | `500` | `--font-weight-medium` |
| semibold | `600` | `--font-weight-semibold` |
| bold | `700` | `--font-weight-bold` — serif headlines only, used sparingly |

### 3.4 Spacing

| Scale | Value | Token Variable |
|-------|-------|----------------|
| 0 | `0` | `--spacing-0` |
| 1 | `0.25rem` | `--spacing-1` |
| 2 | `0.5rem` | `--spacing-2` |
| 3 | `0.75rem` | `--spacing-3` |
| 4 | `1rem` | `--spacing-4` |
| 6 | `1.5rem` | `--spacing-6` |
| 8 | `2rem` | `--spacing-8` |
| 12 | `3rem` | `--spacing-12` |
| 16 | `4rem` | `--spacing-16` |
| 24 | `6rem` | `--spacing-24` — standard section vertical padding |
| 32 | `8rem` | `--spacing-32` — hero/final-CTA vertical padding |

### 3.5 Radius & Shadow

| Radius | Value | Token Variable |
|--------|-------|----------------|
| sm | `0.25rem` | `--radius-sm` |
| md | `0.5rem` | `--radius-md` — default card/button radius |
| lg | `0.75rem` | `--radius-lg` |
| xl | `1rem` | `--radius-xl` |
| full | `9999px` | `--radius-full` — pills/badges |

| Shadow | Value | Token Variable |
|--------|-------|----------------|
| sm | `0 1px 2px 0 rgb(11 18 32 / 0.04)` | `--shadow-sm` |
| md | `0 4px 10px -2px rgb(11 18 32 / 0.08)` | `--shadow-md` — status feed cards |
| lg | `0 12px 24px -6px rgb(11 18 32 / 0.10)` | `--shadow-lg` — showcase visual panel |

Shadows are tinted from `--ink` rather than pure black, and kept low-opacity/low-spread — nothing should look like a floating SaaS card.

---

## 4. Page Structure & Section-by-Section Design

### 4.1 Hero
- Two-line serif headline, left-aligned or centered depending on existing layout convention:
  *"Stop chasing scholarships. Let your agent handle the paperwork."*
- One-line sans-serif supporting copy below.
- Primary CTA (filled, accent color): **Get Started**
- Secondary CTA (outline/ghost): **See how it works**
- No cards, no stats, no feature grid in this viewport — mirrors the brief's instruction to keep the first screen understated and confident, the way the reference hero uses two buttons and nothing else.
- Optional: a single quiet visual motif (e.g., a document/checkmark morphing icon) — not a busy product screenshot.

### 4.2 Trusted-By / Legitimacy Marquee
Reframe "trusted by companies" into **"schemes & sources we track"** — logos or names of government departments / scheme categories (e.g., state education boards, scholarship portals) presented as a continuous horizontal marquee.
- Smooth, continuous, seamless loop — no jump/reset.
- Pause on hover; respect `prefers-reduced-motion` (freeze-frame, no motion).
- This section functions as a **legitimacy signal**, not a logo-flex — caption it plainly: "We check schemes against official government sources."

### 4.3 Agentic Value (short progression)
Four short beats, large type, minimal decoration:
`Find it.` → `Understand it.` → `Prepare it.` → `Track it.`
Each can highlight briefly as the user scrolls (simple scroll-triggered emphasis, not a full showcase component) to reinforce that the agent *acts*, not just informs.

### 4.4 Feature Introduction (capability strip)
A restrained intro row (reference: the reference site's "Content Pipelines / Context Hub" card strip) reused conceptually — a few compact cards for our own capabilities, each with a small illustrative icon (not a screenshot):
- **Scheme Discovery**
- **Application Preparation**
- **Legitimacy Checks**
- **Status Tracking**

Keep icons abstract/line-art (documents, checkmarks, search, bell) — not literal AI/robot iconography.

### 4.5 Main Interactive Showcase — "How your agent works"
This is the centerpiece, using the two-column auto-cycling pattern:

**Left column:** vertical list of 5 steps (numbered, sans-serif):
1. Tell us about yourself
2. Your agent finds opportunities
3. Your agent prepares the application
4. You stay in control
5. Your agent keeps watching

**Right column:** a visual that swaps per active step (profile form → search/matching → document assembly → OTP/identity-confirmation moment → status tracker), synced with the active step's copy.

Behavior:
- Auto-advance on a generous timer (6–8s), long enough to read a 1–2 sentence description.
- Manual click/tap on any step jumps immediately and **pauses** the auto-cycle for a beat before resuming — never fights the user.
- Transition: crossfade + small slide (8–12px) + subtle scale (0.98→1) on both text and visual simultaneously. No hard cuts.
- Progress shown as a thin animated underline/bar per step, not a slideshow dot indicator.
- Step 4 ("You stay in control") should visually read distinctly calmer/more manual — this is the trust beat; do not automate it into feeling routine.

### 4.6 "While You're Away" — Agentic Moment
A single focused section proving async, ongoing work. Visual: a simple activity/status feed card:
```
✓  Application submitted
✓  Status checked
●  Waiting for department response
⚠  Action required
```
- Statuses use the functional status colors from §3.
- Optional subtle animation: items appear one at a time on scroll-into-view (staggered fade/slide-up, ~80ms stagger) — implies live monitoring without a literal live demo.
- Headline: **"You don't have to keep checking."**

### 4.7 Trust / Human Control
Quiet, text-forward section — deliberately less visual than the sections around it, to signal seriousness.
- Message: **"Your agent handles the work. You make the important decisions."**
- Explicitly call out identity verification / OTP as always user-controlled.
- Consider a small static diagram: agent path with a manual "handoff" node at OTP/identity — one clear interruption point in an otherwise automated flow.

### 4.8 Documents / DigiLocker
Compact, single-row section — not a hero feature.
- **"Connect your documents once. Reuse them across applications."**
- One small supporting visual (document → checkmark → reuse icon). Keep brief; this is an enabler, not a selling point.

### 4.9 Phone / Accessibility
- **"No smartphone? No problem."**
- Supporting line about voice/phone access to discovery and updates.
- Visual: simple phone/voice waveform icon — avoid making it look like a basic IVR mockup; keep it in the same editorial visual language as the rest of the page.

### 4.10 Final CTA
- Serif headline: **"Your next opportunity shouldn't be lost in paperwork."**
- Sub-line: "Create your profile. Let your agent take it from there."
- Single CTA: **Get Started**
- Generous whitespace above/below — let this section breathe as a clean close.

### 4.11 Footer
Standard footer per existing project conventions; keep visually quiet relative to the rest of the page.

---

## 5. Component Architecture

```
components/landing/
  Hero.tsx
  SchemeSourceMarquee.tsx
  CapabilityIntro.tsx
  AgentWorkflowShowcase.tsx     // the auto-cycling step/visual pair
  StatusFeedMoment.tsx          // "while you're away"
  TrustControlSection.tsx
  DocumentsSection.tsx
  PhoneAccessSection.tsx
  FinalCTA.tsx
  Footer.tsx
```

Steps for `AgentWorkflowShowcase` should be structured data, not hardcoded markup:

```ts
type WorkflowStep = {
  id: string;
  title: string;
  description: string;
  visual: React.ComponentType | string; // component or asset ref
};

const steps: WorkflowStep[] = [
  { id: "profile", title: "Tell us about yourself", description: "...", visual: ProfileVisual },
  { id: "discover", title: "Your agent finds opportunities", description: "...", visual: DiscoverVisual },
  { id: "prepare", title: "Your agent prepares the application", description: "...", visual: PrepareVisual },
  { id: "control", title: "You stay in control", description: "...", visual: ControlVisual },
  { id: "track", title: "Your agent keeps watching", description: "...", visual: TrackVisual },
];
```

---

## 6. Responsive Behavior

- Desktop: two-column pattern (steps | visual) for §4.5.
- Mobile: vertical stack — title → description → visual, per active step; auto-advance continues but keep touch targets large and swipe/tap-friendly.
- Marquee (§4.2) and status feed (§4.6) both need to degrade gracefully to single-column, reduced-height on small screens.
- Do not simply scale down desktop layouts — re-flow each section per its own mobile pattern.

---

## 7. Animation & Performance

- CSS transitions/transforms (`opacity`, `transform`) preferred over JS-driven layout animation.
- One `requestAnimationFrame`/timer loop max for the showcase auto-advance; clean up on unmount.
- Marquee via CSS `@keyframes` translate loop, GPU-accelerated, seamless (duplicate content technique, not a hard reset).
- Respect `prefers-reduced-motion`: disable marquee scroll and auto-advance timers; make step switching manual-only and instant (no slide/scale).
- No animation should block scrolling or cause layout shift — reserve fixed heights for the showcase visual area.

---

## 8. Content & Tone Guardrails

- Clear, human, trustworthy, slightly ambitious, student-friendly. Not corporate, not technical.
- Never expose implementation details (no model names, no infra, no "agents/sub-agents" architecture talk) anywhere on the page.
- Every feature is framed as a **benefit to the user**, never as an AI capability list.
- Central message to preserve everywhere: **the user has a goal, the agent does the work, the user stays in control.**

---

## 9. What We Take From the Reference Site vs. What We Never Copy

**Take (pattern-level only):**
- Serif display headline paired with restrained sans body copy
- Continuous logo/source marquee for legitimacy signaling
- Two-column auto-cycling feature showcase with synced copy + visual
- Calm, functional motion (fade/slide/scale, no dramatic effects)

**Never copy:**
- Exact copy, colors, layout, spacing, illustrations, or code
- Pink/bright accent system, chat-widget UI, or SaaS-marketing tone
- Any literal scholarship-directory visual pattern (search bar + result cards as the hero)

---

## 10. Quality Bar Before Shipping

- [ ] Hero reads clearly in under 3 seconds, no clutter
- [ ] Marquee loops seamlessly, pauses on hover, respects reduced-motion
- [ ] Showcase auto-advances, responds correctly to manual selection, never fights the user
- [ ] Status feed colors are used only functionally, never decoratively
- [ ] Trust/control section reads noticeably calmer than the rest of the page
- [ ] No technical/AI-implementation language appears anywhere
- [ ] Fully responsive: showcase and marquee both re-flow (not just shrink) on mobile
- [ ] No layout jump or flicker during any transition
- [ ] Page does not read as a Jasper clone or as a generic scholarship directory