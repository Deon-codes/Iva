# Implementation Plan - Hazela Landing Page

We will implement the complete React landing page for **Hazela** inside [App.jsx](file:///c:/Users/Deon%20Raj/OneDrive/Desktop/Vs_code/Hazela_codes/frontend/src/App.jsx) based on the spec in [Design.md](file:///c:/Users/Deon%20Raj/OneDrive/Desktop/Vs_code/Hazela_codes/Design.md). The design will incorporate the visual patterns of the reference screenshots:
- **First Image:** A two-column auto-cycling feature showcase with vertical tabs that expand when active and display progress bars. The right column shows a visual card state synced with the active step.
- **Second Image:** Restrained capability cards ("Content Pipelines / Context Hub") styled with custom grid backgrounds and line-art vector-style diagrams explaining the application's underlying architecture.

---

## Proposed Changes

### Frontend Landing Page Implementation

#### [MODIFY] [App.jsx](file:///c:/Users/Deon%20Raj/OneDrive/Desktop/Vs_code/Hazela_codes/frontend/src/App.jsx)
We will completely rewrite `App.jsx` to build the premium, editorial-style landing page.

- **Theme & Palette System (CSS Variables):**
  - Background: `--paper` (`#FAF8F4`) and Surface: `--paper-card` (`#FCFAF6`)
  - Primary text: `--ink` (`#0B1220`)
  - Accent color: `--color-accent-500` (`#C6841F`) with hover state `#A66A16`
  - Semantic colors: Success (`#4B7A5E`), Pending (`#C6841F`), Attention (`#B4543D`), and Line/Grid (`#D3D7E3`)
  - Typography: Serif display typography for displays/H1s (Georgia/Times New Roman fallback stack) and sans-serif (Plus Jakarta Sans) for body copy.

- **Section-by-Section Components:**
  1. **Navigation:** Small, premium top bar with the `hazela` brand text, primary CTA, and links.
  2. **Hero:** Centered display serif headline: *"Stop chasing scholarships. Let your agent handle the paperwork."*, paired with standard CTA buttons.
  3. **Marquee ("Schemes We Track"):** A GPU-accelerated horizontal marquee looping official government departments and boards. Pauses on hover.
  4. **Agentic Progression:** Minimalist vertical/horizontal progression strip: *Find it. → Understand it. → Prepare it. → Track it.*
  5. **Capability strip (reference: Second Image):** 
     - Cards showing "Scheme Discovery", "Application Preparation", "Legitimacy Checks", and "Status Tracking".
     - Styled with distinct **grid backgrounds** and thin vector lines/node diagrams in SVG representing document analysis and content pipelines.
  6. **Interactive Showcase (reference: First Image):**
     - Left Column: Step tabs (1. Tell us about yourself, 2. Finds opportunities, 3. Prepares application, 4. Stay in control, 5. Keeps watching).
     - Underline animated progress bars synced with an auto-cycle timer (6s). Clicking a step pauses the timer.
     - Right Column: A card displaying interactive visual simulators:
       - Profile assembly with personal details mapping.
       - Scanning animation checking multiple scheme databases.
       - Document compilation showing PDF generation.
       - Secure OTP consent prompt emphasizing manual control.
       - Live check status timelines.
  7. **"While You're Away" Agentic Moment:** Status checker card showing background runs with success/pending/attention tags.
  8. **Trust & Human Control Section:** An explicit flow diagram depicting where user confirmation (like OTPs) intercepts the agent.
  9. **DigiLocker & Voice Accessibility sections:** Clean editorial feature blocks.
  10. **Final CTA & Footer:** Elegant editorial closing section.

---

## Verification Plan

### Automated Build Verification
We will run `npm run build:frontend` to verify that there are no compilation errors or Vite bundling issues.

### Manual Verification
1. Open the local Vite development server via browser subagent.
2. Verify visual appearance: color palette contrast, serif display headers, and responsive layout.
3. Test interaction:
   - Ensure the marquee loops smoothly and pauses on hover.
   - Verify the auto-cycling steps advance every 6 seconds, and clicking a step displays the correct visual on the right and pauses auto-advance.
   - Validate that all CTAs and interactive cards behave responsively.
