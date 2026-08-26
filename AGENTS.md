# AGENTS.md — Person 2
# Frontend + User API / Agentic User Experience

## 1. ROLE

You are responsible for the **frontend and frontend-facing API integration layer** of the Agentic Government Schemes & Scholarships Platform.

You own:

- Next.js / React frontend
- Authenticated user experience
- Onboarding
- Chat / Agent interface
- Explore interface
- Applications interface
- User/profile API integration
- Scheme API integration
- Application API integration
- Document/status presentation
- Frontend validation
- Loading/error/empty states
- Frontend tests
- Agentic visual states and interactions

You do NOT own:

- Central ADK agent architecture
- Core Gemini orchestration
- IVR / telephony system
- Async status-monitoring engine
- Real government portal automation

---

# 2. EXECUTION PRIORITY

This file defines responsibilities and constraints.

It is NOT an instruction to implement every feature immediately.

Only work on the specific task requested by the user in the current session.

Do NOT proactively:
- redesign unrelated pages
- implement future features
- refactor unrelated code
- create unnecessary architecture
- perform speculative improvements
- repeatedly inspect the repository
- repeatedly run Git commands

When the requested task is complete and verified, STOP.

---

# 3. PROJECT CONTEXT

The product is an **Agentic Government Schemes & Scholarships Platform**.

The agent helps users:

1. Discover relevant schemes/scholarships
2. Understand eligibility
3. Verify legitimacy
4. Check required documents
5. Prepare applications
6. Fill application forms
7. Stop at human-controlled OTP / identity verification
8. Track applications asynchronously
9. Explain rejection/status changes
10. Tell the user when action is required

The core philosophy is:

> The user delegates the work. The agent handles the process.

The frontend must make this obvious.

This should NOT feel like:

> "A government website with an AI chatbot."

It should feel like:

> "An agent is working for me."

---

# 4. EXISTING LANDING PAGE

An initial landing page has already been created.

## DO NOT redesign or replace it.

The landing page is only the entry point.

Its intended flow is:

Landing
↓
Login / Sign Up
↓
Authenticated Product
↓
Agent Experience

The existing landing page should remain visually and structurally unchanged unless the user explicitly asks for changes.

Only implement the minimum connection required for:

- Login
- Sign Up
- Navigation into the authenticated product

Do not spend time redesigning the landing page.

---

# 5. PRIMARY PRODUCT STRUCTURE

The authenticated product intentionally has THREE primary sections:

## 1. Chat / Agent
Primary home and core experience.

## 2. Explore
Personalized browsing of schemes/opportunities.

## 3. Applications
Applications being prepared, submitted, monitored, or requiring action.

These three sections are connected.

They must NOT feel like separate disconnected pages.

The agent is the common layer between all three.

---

# 6. PRODUCT FLOW

The main conceptual flow is:

User need
↓
Chat / Agent
↓
Discover
↓
Check eligibility
↓
Verify legitimacy
↓
Check documents
↓
Prepare application
↓
Human review
↓
OTP / identity verification
↓
Application submitted
↓
Agent monitors
↓
Status changes
↓
User notified
↓
Agent helps with next action

The user should never feel like they have to manually navigate through a complicated government workflow.

---

# 7. CHAT — PRIMARY EXPERIENCE

Chat is the HOME page.

It is not simply a messaging interface.

It is the **Agent Workspace / Command Center**.

The user should be able to say:

> "Find scholarships I qualify for."

> "Find scholarships closing this month."

> "Can I apply for this?"

> "Prepare the application."

> "What documents am I missing?"

> "Why was my application rejected?"

> "What happened while I was away?"

The agent may also proactively surface useful information.

Examples:

> "I found 3 scholarships that match your profile."

> "Your income certificate expires in 21 days."

> "Your application status changed."

---

# 8. CHAT — DESKTOP DESIGN

The desktop authenticated experience should follow the approved visual direction.

Use the current approved desktop reference as the design foundation.

The desktop layout should feel like an **agent workspace**, not a dashboard.

Primary structure:

- left navigation / section navigation where appropriate
- large central agent/chat workspace
- prominent Bloub agent presence
- contextual/trending content area where appropriate
- contextual work cards
- agent activity/state

The main focus should remain on:

1. The agent
2. The user's current task
3. What the agent is doing

Do not fill the interface with unnecessary widgets.

---

# 9. CHAT — MOBILE DESIGN

Mobile should use a simplified version of the approved mobile direction.

Requirements:

- No desktop-style permanent sidebar
- Hamburger menu at the top
- Chat remains the primary screen
- Bloub remains visible as the agent identity
- Content/cards stack naturally
- Navigation between Chat / Explore / Applications must remain easy
- Avoid consuming valuable vertical space with unnecessary UI

The mobile interface should feel like a focused agent experience, not a compressed desktop dashboard.

---

# 10. MOBILE NAVIGATION

The approved mobile direction uses:

- Hamburger/menu access
- Compact section navigation
- Chat as primary
- Explore
- Applications

The red-marked conceptual region from the reference represents navigation between the three main sections.

The implementation should make it obvious which section is active.

Possible structure:

Chat | Explore | Applications

The exact interaction can be adapted for the viewport, but the navigation should remain minimal.

---

# 11. TRENDING / CONTEXTUAL CAROUSEL

The approved design includes a carousel/strip of relevant content.

This area should contain **real contextual information**, not generic marketing cards.

Examples:

- New scholarship opportunities
- Opportunities matching the user's profile
- Deadlines approaching
- Documents needing attention
- Recent agent discoveries

Example:

"3 opportunities found"

"Scholarship deadline in 5 days"

"Your agent found 2 new matches"

The carousel should remain visually secondary to the main agent experience.

Do not let it become the dominant part of the UI.

---

# 12. AGENT VISUAL IDENTITY — BLOUB

The project uses an organic morphing **Bloub-style agent visual**.

The Bloub assets/animations are already available in the project's `public/` folder.

## IMPORTANT

Before implementing:

1. Inspect the existing Bloub assets in `public/`.
2. Identify the available animation files.
3. Reuse those existing assets.
4. Do NOT download or recreate substitute assets.
5. Do NOT replace the assets with generic CSS blobs unless explicitly instructed.

The Bloub is the visual embodiment of the agent.

It is NOT merely decorative.

---

# 13. BLOUB STATES

There are exactly seven available states.

Map them intentionally:

## 1. ATTENTIVE

Use when:

- user is actively typing
- user is speaking
- user has initiated an interaction
- agent is actively listening

Meaning:

> "I'm focused on you."

---

## 2. CONFUSED

Use when:

- information is ambiguous
- required information is missing
- the agent needs clarification

Example:

> "I need to know your current education level."

---

## 3. EXCITED

Use when:

- a strong scholarship match is found
- a major task is successfully completed
- a useful opportunity is discovered

Example:

> "I found a scholarship that matches your profile extremely well."

---

## 4. NEUTRAL

Use when:

- agent is idle
- no task is currently running
- normal resting state
- default state

This is the normal default.

---

## 5. SLEEPY

Use when:

- agent is waiting
- no immediate task is active
- low-activity background state

Use subtly.

Do NOT make the product look broken or inactive.

---

## 6. SURPRISED

Use when:

- the agent discovers unexpected information
- a surprising opportunity appears
- a status unexpectedly changes

Example:

> "Your application status changed earlier than expected."

---

## 7. SUSPICIOUS

Use when:

- legitimacy verification finds a possible issue
- an unofficial/suspicious source is detected
- an application fee or suspicious behavior is detected
- information conflicts with official sources

This state is especially important because legitimacy/scam detection is a major product feature.

Example:

> "I couldn't verify this scholarship against the official registry."

---

# 14. BLOUB STATE RULES

Do NOT randomly animate/switch states.

The state must correspond to actual application/agent context.

State priority should be deterministic.

Example priority:

1. Suspicious
2. Confused
3. Surprised
4. Excited
5. Attentive
6. Neutral
7. Sleepy

If a high-priority state occurs, it should override a low-priority idle state.

Do not rapidly switch between states.

Avoid excessive animation that distracts from the task.

---

# 15. BLOUB — DESKTOP

Desktop should give the Bloub enough visual prominence to establish the agent's identity.

The Bloub can appear near the main greeting / agent workspace.

It should visually communicate:

> "This is the agent."

When the agent is actively working, the surrounding UI should make the state visible.

Example:

Bloub
+
"Checking your eligibility..."

or:

Bloub
+
"Preparing your application..."

---

# 16. BLOUB — MOBILE

Do NOT simply copy the large desktop Bloub onto mobile.

Mobile should use a compact agent identity.

Recommended placement:

- top area/header near agent identity
- beside the agent name/status
- persistent but compact

When the agent becomes active, the Bloub may temporarily become more prominent.

Example:

Idle:

Small Bloub in header.

Active:

Larger Bloub + agent progress.

Waiting for user:

Compact Bloub + clear action request.

Do NOT place a large floating Bloub over the bottom message/input area.

---

# 17. AGENT WORK CARDS

Do NOT use generic AI suggestion chips as the primary home interaction.

Use small contextual cards that represent actual user-specific agent work.

Possible cards:

- scholarships discovered
- applications in progress
- upcoming deadlines
- document warnings
- recent agent actions
- status updates

Visual inspiration:

Cards may feel like physical notes/cards partially tucked into a surface.

Use:

- depth
- soft shadow
- subtle glow
- small count badge
- muted update time
- meaningful content

The card should feel like:

> "This is something the agent found or is working on for me."

Not:

> "Here is a generic feature card."

---

# 18. CHAT — AGENT ACTIVITY

When the agent works, show meaningful activity.

Example:

Preparing application...

✓ Profile information checked
✓ Eligibility verified
✓ Documents matched
● Filling application
○ Review
○ OTP handoff

Another example:

Finding scholarships...

✓ Profile loaded
✓ Eligibility requirements understood
● Searching schemes
○ Comparing opportunities
○ Preparing recommendations

Do not show fake progress.

Only display steps that correspond to actual application state or meaningful agent operations.

---

# 19. EXPLORE

Explore is for users who prefer to browse themselves.

It should follow the approved Explore visual reference.

Design direction:

- search
- category/filter controls
- personalized opportunities
- compact content cards
- clean discovery layout
- content-focused browsing
- minimal chrome

Do NOT turn Explore into:

- a dense government data table
- a generic admin dashboard
- an unpersonalized directory

Explore is still personalized from known user context.

---

# 20. EXPLORE CONTENT

Each scheme/opportunity can show:

- Scheme name
- Department
- Benefit
- Eligibility
- Deadline
- Required documents
- Legitimacy status
- Official source
- Why it may be relevant
- Next recommended action

Never invent information.

---

# 21. EXPLORE → CHAT

Every important Explore result should have an agent handoff.

Example:

Scholarship A

[View Details]

[Ask Agent]

[Prepare Application]

When the user chooses:

[Ask Agent]

Open Chat with:

- scheme already in context
- current user profile context
- relevant scheme information

The user should not need to explain the scheme again.

---

# 22. APPLICATIONS

Applications shows the user's ongoing and completed application workflows.

It should show:

- Preparing
- Ready for review
- Submitted
- Under review
- Action required
- Approved
- Rejected
- Historical applications

Do NOT make this only a table.

Show the application's journey.

Example:

Scholarship A

✓ Profile verified
✓ Documents matched
✓ Form prepared
⚠ Review required
🔒 OTP / final submission

The user should understand:

- what happened
- what the agent did
- current state
- what they need to do
- what happens next

---

# 23. APPLICATION WORKSPACE

The application workspace should make agent activity visible.

Example:

Profile
✓ Complete

Eligibility
✓ Verified

Documents
✓ Matched

Application
✓ Prepared

Review
⚠ User review required

Identity Verification
🔒 OTP required

The interface MUST clearly communicate:

> "The agent has prepared the application. Identity verification and final submission require the user."

Never imply OTP/CAPTCHA bypass.

---

# 24. APPLICATIONS → CHAT

Applications should connect back to Chat.

Example:

Application:
Scholarship A

Status:
Action Required

Reason:
Income certificate mismatch.

Button:

[Ask Agent What Happened]

The Chat experience opens with application context already available.

The user should not have to restate the problem.

---

# 25. DOCUMENT PRESENTATION

Do not create a huge file-manager-style experience.

Documents can be presented contextually.

Show:

- type
- validity
- status
- expiry
- verification
- applications using it

Example:

Income Certificate

✓ Available

Expires in 28 days

Used by:
2 applications

The agent should surface document problems at the moment they matter.

---

# 26. USER PROFILE

Keep profile information centralized.

Use the profile for:

- personal information
- education
- income
- category where relevant
- contact information
- preferences
- document connection/status

Do NOT create unnecessary separate sections for every type of data.

Progress and important state should appear in Chat and Applications.

---

# 27. DIGILOCKER / CONNECTED DOCUMENTS

If/when DigiLocker integration is available:

Treat it as a connection/action inside Profile or Documents.

Do not create an unnecessary permanent fourth navigation item.

Example:

Connected Documents
DigiLocker ✓ Connected

Documents available:
12

[Manage]

The agent can then use the available document metadata as part of the application workflow.

If real DigiLocker integration is not available in the current implementation, use an appropriate mock/adapter rather than inventing credentials or insecure flows.

---

# 28. RESPONSIVE DESIGN

Support:

- desktop
- tablet
- mobile

Do not simply shrink desktop.

Mobile should be intentionally designed.

Maintain:

- agent presence
- easy Chat access
- section navigation
- readable cards
- accessible application states

---

# 29. VISUAL CONSISTENCY

The project's color scheme has already been decided.

Follow the existing approved color system.

Do NOT invent a new palette.

Do NOT replace the chosen brand colors.

Do NOT introduce unrelated gradients or accent colors.

Use centralized design tokens/theme variables where they already exist.

Typography should follow the established project design system.

Do not casually change fonts.

---

# 30. TECH STACK

Use the agreed stack:

- Next.js / React
- TypeScript where practical
- FastAPI integration
- Firebase Auth
- Firestore through approved backend APIs
- Google Cloud where appropriate

Never put Gemini API keys or service credentials in the frontend.

The backend remains the source of truth.

---

# 31. API RESPONSIBILITIES

Use the agreed API contracts.

Expected examples:

POST /api/profile
GET /api/profile

POST /api/chat

GET /api/schemes
GET /api/schemes/{id}

POST /api/applications
GET /api/applications
GET /api/applications/{id}

GET /api/applications/{id}/events

GET /api/documents
POST /api/documents

Do NOT duplicate agent logic.

Do NOT create another Gemini orchestration layer.

---

# 32. IF BACKEND APIs ARE NOT READY

If an API is not implemented yet:

Do NOT redesign the backend.

Use:

- typed interface
- temporary mock adapter
- local fixture
- mock response

Keep the interface compatible with the agreed backend contract.

Document what is needed for integration.

Do not create fake permanent backend logic.

---

# 33. TESTING

Test:

- authentication
- onboarding
- Chat
- Explore
- Applications
- Chat ↔ Explore handoff
- Chat ↔ Application handoff
- application state
- agent visual states
- loading
- errors
- empty states
- responsive behavior
- API integration

Critical demo path:

Landing
↓
Login
↓
Onboarding
↓
Chat
↓
Scheme
↓
Legitimacy
↓
Application
↓
Review
↓
OTP handoff
↓
Tracking

---

# 34. DEVELOPMENT WORKFLOW

Follow this exact process.

## STEP 1 — INSPECT ONCE

Read:

- AGENTS.md
- BUILD_STATUS.md
- relevant frontend files
- relevant existing components
- Bloub assets in public/

Do not repeatedly inspect the repository.

## STEP 2 — PLAN

Identify:

- what already exists
- what needs to change
- which files are involved
- what must remain untouched

Keep the plan concise.

## STEP 3 — IMPLEMENT

Implement the requested task.

Prefer modular, reusable components.

Do not redesign unrelated functionality.

Do not modify the landing page unless explicitly requested.

## STEP 4 — VERIFY

Run only the checks needed for the requested change.

Do not repeatedly rerun successful commands.

## STEP 5 — UPDATE BUILD STATUS

Update BUILD_STATUS.md.

## STEP 6 — STOP

When the requested task is complete and verified:

STOP.

Do not continue implementing future features.

Do not perform speculative redesigns.

Do not repeatedly run terminal/Git commands.

---

# 35. GIT SAFETY

You are working inside a shared Git repository.

DO NOT:

- switch branches
- create branches
- merge branches
- rebase
- reset
- force push
- modify another person's branch
- rewrite Git history

Stay on the assigned branch.

Do not perform Git operations unless explicitly requested by the user.

The user/team handles:

- commits
- pushes
- merges
- branch management

---

# 36. RESOURCE / CREDIT SAFETY

Do not unnecessarily consume AI/cloud resources.

Do NOT repeatedly run:

- git status
- git diff
- git log
- git fetch
- git pull
- git push
- builds
- dev servers
- tests

Do not create command loops.

Do not repeatedly inspect the same files when nothing has changed.

Only execute commands that are necessary for the current task.

If API/cloud usage approaches a warning or quota:

STOP unnecessary usage.

Use:

- mock data
- local fixtures
- cached responses
- deterministic data
- local development

where possible.

Record the issue in BUILD_STATUS.md.

---

# 37. BUILD_STATUS.md

You MUST maintain BUILD_STATUS.md.

Before starting work:

Read it once.

After meaningful progress:

Update it.

Before ending the session:

Update it.

Track:

- ✅ Completed
- 🔄 In progress
- ⏳ Remaining
- 🚫 Blockers
- ➡️ Exact next step
- 💡 Important technical decisions

This is a checkpoint/handoff document.

It is NOT:

- a transcript
- a command log
- terminal output
- a list of every tiny action

Keep it concise.

---

# 38. DEFINITION OF DONE

Frontend work is complete when:

- Existing landing page remains unchanged
- Landing page leads into Login / Sign Up
- Authentication works
- Authenticated product shell exists
- Chat is the primary experience
- Explore works
- Applications works
- Chat ↔ Explore works
- Chat ↔ Applications works
- Agent states are visually represented
- Bloub states are correctly used
- Agent activity/progress is visible
- Application workflow is understandable
- Document/status information is understandable
- Loading/error/empty states work
- Responsive behavior works
- Critical frontend tests pass
- API integration is clean
- BUILD_STATUS.md is updated
- No unnecessary Git operations were performed

---

# 39. FINAL PRODUCT PRINCIPLE

Do NOT build:

> "A scholarship website with an AI chatbot."

Build:

> **"An agent interface that happens to have a website around it."**

The user should feel:

> "I told it what I need, and it is taking care of the process."

NOT:

> "I am navigating a scholarship website and occasionally asking AI for help."

The agent should feel continuously present.

The interface should minimize navigation, reduce cognitive load, and make the agent's work visible without turning the product into a conventional dashboard.
:::
# 40. VISUAL REFERENCE IMAGES

The user has provided four reference images for the frontend implementation.

These images are part of the design specification.

Use them to understand:
- Desktop layout
- Mobile layout
- Section navigation
- Trending/contextual carousel placement
- Explore page structure
- Spacing and visual hierarchy
- Agent placement
- Responsive behavior

IMPORTANT:
The images are reference specifications, not invitations to redesign the product.

Follow the user's written instructions first.
Use the images to resolve visual/layout questions.

Do NOT:
- copy unrelated content from the references
- copy branding from the references
- copy colors unless explicitly specified by the project
- redesign the existing landing page
- introduce extra navigation sections because they appear in a reference image

The four references correspond to:

1. Desktop authenticated experience
2. Mobile authenticated Chat experience
3. Mobile navigation / section switching and contextual carousel concept
4. Explore page visual direction

When the written requirements and image appear to conflict, follow the latest explicit user instruction.