# AGENTS.md — Person 2
# Frontend + User API / User Experience
## EXECUTION PRIORITY

This file defines responsibilities and constraints; it is NOT a command to implement every feature immediately.

Only work on the specific task requested by the user in the current session.

Do not proactively implement future features, redesign unrelated pages, refactor unrelated code, or perform extra work simply because it is described elsewhere in this file.

If the user has not asked for implementation of a section, leave it alone.

When the requested task is complete and verified, STOP.
## 1. ROLE

You are responsible for the **frontend and frontend-facing API integration layer** of the Agentic Government Schemes & Scholarships Platform.

You are NOT only a UI developer.

You own:

- React / Next.js frontend
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

You do NOT own the central ADK agent architecture.

You do NOT own the IVR system.

You do NOT own the asynchronous status-monitoring engine.

---

# 2. PROJECT CONTEXT

The product is an **Agentic Government Schemes & Scholarships Platform**.

The goal is not simply to tell users about scholarships.

The agent should help the user:

1. Discover relevant schemes/scholarships
2. Check eligibility
3. Verify legitimacy
4. Check required documents
5. Prepare applications
6. Fill application forms
7. Stop at human-controlled OTP/identity verification
8. Track applications asynchronously
9. Explain status changes or rejection reasons
10. Tell the user when action is required

The core philosophy is:

> The user delegates the work. The agent handles the process.

The frontend must make this obvious.

---

# 3. IMPORTANT: EXISTING LANDING PAGE

An initial landing page has ALREADY been created.

## DO NOT redesign or replace the existing landing page.

The existing landing page is intentionally only a **starting/entry page**.

Its purpose is:

Landing Page
↓
Login / Sign Up
↓
Authenticated Product
↓
Continue with the actual agent experience

The current landing page does NOT need to contain the complete product experience.

Do not spend development time redesigning it.

Do not rewrite its visual design.

Do not replace it with another landing page.

Only make the minimum connection necessary for:

- Login
- Sign Up
- Continuing into the authenticated application

After authentication, the user should enter the actual product experience described in this document.

---

# 4. PRIMARY PRODUCT STRUCTURE

The authenticated application intentionally has THREE primary sections:

1. Chat
2. Explore
3. Applications

Keep the product surface area intentionally small.

Do not create unnecessary navigation sections.

The three sections should continuously connect back to the agent.

---

# 5. CHAT — PRIMARY EXPERIENCE

Chat is the HOME / MAIN page.

It is NOT simply a chatbot.

It is the agent's workspace and command center.

The user should be able to delegate tasks such as:

> "Find scholarships I qualify for."

> "Find scholarships closing this month."

> "Can I apply for this scholarship?"

> "Prepare the application for me."

> "What documents am I missing?"

> "Why was my application rejected?"

> "What should I do next?"

The agent should also proactively surface useful information.

For example:

> "I found 3 scholarships that match your profile."

or:

> "Your income certificate expires in 21 days."

The user should feel that the agent is already working on their behalf.

---

# 6. CHAT MUST NOT LOOK LIKE A GENERIC CHATGPT CLONE

Avoid simply creating:

- Large blank chat screen
- Generic message bubbles
- Prompt suggestion chips
- Static AI orb
- Standard ChatGPT sidebar
- Generic dashboard cards

The interface should communicate:

> "I gave this task to an agent and it is working on it."

The agent's actions and state should be visually understandable.

---

# 7. AGENT VISUAL PRESENCE

The agent will have an organic morphing blob / character inspired by the interaction style of Bloub.

The blob is NOT merely decoration.

It represents the current state of the agent.

Available states:

- Neutral
- Attentive
- Confused
- Suspicious
- Surprised
- Sleepy
- Excited

Use the states intentionally.

Examples:

### Neutral

Agent is idle.

### Attentive

User is typing, speaking, or actively interacting.

### Confused

Required information is ambiguous or missing.

### Suspicious

A scheme or application appears potentially suspicious or requires legitimacy attention.

### Surprised

The agent discovers something unexpected.

### Excited

The agent finds a particularly relevant opportunity or completes an important task.

### Sleepy

Optional low-activity / waiting state.

Do NOT randomly switch between states.

The visual state must correspond to actual agent context.

---

# 8. AGENT WORKING STATES

When the agent is doing something, the UI should make the process visible.

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
✓ Requirements understood
● Searching opportunities
○ Ranking relevant schemes
○ Preparing recommendations

Do not leave the user staring at:

> "Thinking..."

for a long period.

Whenever backend state allows it, communicate meaningful progress.

---

# 9. AGENT HOME CONTENT

The Chat home should feel useful even before the user sends a message.

Possible content:

- Opportunities found
- Applications needing attention
- Upcoming deadlines
- Document expiry warnings
- Recent agent actions
- Important alerts

Example:

> Good morning.

> I found 3 scholarships that match your profile.

Then display contextual work cards.

---

# 10. AGENT WORK CARDS

Do NOT rely primarily on generic suggestion chips.

Instead, create cards that represent actual user-specific information or agent work.

Cards can represent:

- Opportunities found
- Applications in progress
- Documents requiring attention
- Upcoming deadlines
- Recent agent actions
- Alerts
- Completed tasks

Visual direction:

Cards can feel like a physical note/card partially tucked into another surface.

Use:

- subtle depth
- soft shadows
- restrained borders
- small count badges
- muted timestamps
- real contextual content

Example:

┌──────────────────────────┐
│ 3 NEW OPPORTUNITIES       │
│                          │
│ Scholarships matching    │
│ your profile             │
│                          │
│ Updated 12 min ago       │
└──────────────────────────┘

The content should feel generated from the user's actual state, not like a generic feature card.

---

# 11. EXPLORE

Explore is the human browsing mode.

Some users will want to browse opportunities themselves rather than immediately delegate everything to the agent.

Explore should therefore provide a personalized browsing experience.

It should NOT become a generic government-scheme directory.

Use the user's known context to make results relevant.

Each scheme can show:

- Scheme name
- Department
- Benefit
- Eligibility
- Deadline
- Required documents
- Legitimacy status
- Official source
- Why it may be relevant
- Recommended next action

Never invent scheme information.

---

# 12. EXPLORE → CHAT

Explore must connect directly to the agent.

For example:

User opens:

> Scholarship A

Available actions:

[View Details]

[Ask Agent]

[Prepare Application]

If the user chooses:

> Ask Agent

the Chat experience should open with the scheme already in context.

The user should NOT have to explain the scheme again.

---

# 13. APPLICATIONS

Applications shows:

- Active applications
- Applications being prepared
- Submitted applications
- Applications requiring action
- Approved applications
- Rejected applications
- Application history

Do NOT make Applications only a table.

It should feel like the agent is managing workflows.

Example:

Scholarship A

✓ Profile verified
✓ Documents matched
✓ Form prepared
⚠ Review required
🔒 OTP / final submission

The user should immediately understand:

- What happened
- What the agent did
- What is currently happening
- What requires the user's attention
- What happens next

---

# 14. APPLICATION WORKSPACE

Use a clear workflow representation.

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

Clearly communicate:

> "The agent has prepared the application. Identity verification and final submission require the user."

Never imply that the agent bypasses:

- OTP
- Aadhaar verification
- CAPTCHA
- Government identity controls

---

# 15. APPLICATIONS → CHAT

Applications must connect back to the agent.

Example:

Application:

Scholarship A

Status:

Action Required

Reason:

Income certificate mismatch.

Action:

[Ask Agent What Happened]

The Chat experience should open with the relevant application context.

The user should not have to explain the application again.

---

# 16. DOCUMENTS

Documents should not feel like a generic file manager.

Show useful metadata:

- Document type
- Status
- Issue date
- Expiry date
- Verification status
- Applications using the document

Example:

Income Certificate

✓ Available

Expires in 28 days

Used by:
2 applications

[Review]

The agent can surface document issues contextually.

---

# 17. PROACTIVE AGENT BEHAVIOR

Do not create a separate fourth navigation section for notifications.

Important information should appear through:

- Chat
- Agent work cards
- Applications
- Contextual alerts

Examples:

> "A scholarship deadline is approaching."

> "Your income certificate expires soon."

> "Your application status changed."

> "I found a new opportunity."

This is important because the system is supposed to be agentic and proactive.

---

# 18. USER PROFILE / ONBOARDING

Keep profile management simple.

Collect only information necessary for:

- Eligibility matching
- Scheme discovery
- Application preparation
- Contact

Possible fields:

- Name
- Age
- State
- Education
- Income range
- Category where relevant
- Phone number
- Relevant preferences

Do not unnecessarily collect sensitive information.

Use Firebase Auth for authentication.

---

# 19. TECH STACK

Use the agreed stack:

- Next.js / React
- TypeScript where practical
- FastAPI backend integration
- Firebase Auth
- Firestore through approved backend APIs
- Google Cloud where appropriate

The backend is the source of truth.

Never expose Gemini API keys or service credentials in the frontend.

---

# 20. FRONTEND API RESPONSIBILITIES

Use the agreed API contracts.

Expected endpoints include:

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

Do NOT create a second Gemini orchestration system.

The actual agent logic belongs to the backend/ADK layer.

---

# 21. IF AN API IS NOT READY

If another branch has not implemented an endpoint yet:

Do NOT invent an incompatible architecture.

Use a clean:

- typed interface
- mock adapter
- local fixture
- temporary mock response

Document the expected API contract.

Keep the integration easy to replace with the real backend.

Do not create fake permanent implementations.

---

# 22. VISUAL THEME — NOT DECIDED YET

IMPORTANT:

The final visual identity has NOT been decided.

Do NOT lock the project into a specific:

- color palette
- brand color
- typography system
- gradient system
- shadow style
- background color
- dark/light theme

The design direction is still being explored.

Use centralized design tokens / CSS variables / theme configuration for:

- colors
- fonts
- spacing
- border radius
- shadows
- transitions
- typography scale

This must allow the team to change the visual identity globally later without restructuring the application.

Do NOT hard-code colors throughout individual components.

Do NOT hard-code typography styles everywhere.

The frontend architecture should make future visual experimentation easy.

---

# 23. VISUAL DIRECTION

The product should feel:

- Agentic
- Calm
- Intelligent
- Responsive
- Human
- Modern
- Minimal
- Context-aware

Avoid making it look like:

- A college portal
- A government admin dashboard
- A generic SaaS dashboard
- A ChatGPT clone
- A generic AI wrapper

The interface should communicate that an intelligent system is actively working.

---

# 24. NO UNNECESSARY SIDEBAR

Do NOT copy the traditional ChatGPT/Claude left-side chat history layout.

The primary navigation should remain:

Chat
Explore
Applications

Keep the interface intentionally minimal.

---

# 25. RESPONSIVE DESIGN

Support:

- Desktop
- Tablet
- Mobile

The agent experience should remain understandable on smaller screens.

Do not hide important agent state simply because the screen is smaller.

---

# 26. ACCESSIBILITY

Use:

- Semantic HTML
- Keyboard navigation
- Clear focus states
- Accessible labels
- Readable contrast
- Meaningful status indicators

Do not communicate important information through animation alone.

---

# 27. TESTING

Test the critical flow:

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

Also test:

- Loading states
- Empty states
- API errors
- Network failures
- Invalid inputs
- Application status changes
- Document expiry states
- Agent state rendering

---

# 28. DEVELOPMENT RULE — AVOID CREDIT WASTE

This project has limited AI/cloud credits.

Do NOT repeatedly run commands or tools without a reason.

Especially avoid unnecessary repeated:

- git status
- git diff
- git log
- git fetch
- git pull
- git push
- builds
- dev servers
- tests

Do not enter a loop of checking repository state.

Do not repeatedly inspect the same files when nothing has changed.

Only perform a command when it contributes to the current task.

---

# 29. GIT SAFETY

You are working inside a shared Git repository.

Do NOT:

- Switch branches
- Create branches
- Merge branches
- Rebase
- Reset
- Force push
- Modify another person's branch
- Rewrite Git history

Stay on the currently assigned branch.

Do not perform Git operations unless explicitly requested by the user.

The user/team handles:

- commits
- pushes
- merges
- branch management

---

# 30. DEVELOPMENT WORKFLOW

Follow this workflow.

## STEP 1 — READ ONCE

Read:

- AGENTS.md
- BUILD_STATUS.md
- relevant frontend files

Understand the existing implementation.

Do not repeatedly inspect the repository.

## STEP 2 — PLAN

Identify:

- What already exists
- What needs to change
- Which files are involved
- What must remain untouched

Keep the plan concise.

## STEP 3 — IMPLEMENT

Implement the requested functionality.

Prefer modular changes.

Do not redesign unrelated parts.

Do not modify the existing landing page.

## STEP 4 — VERIFY

Run only the necessary checks/tests.

Do not repeatedly rerun successful commands.

## STEP 5 — UPDATE BUILD STATUS

Update BUILD_STATUS.md.

## STEP 6 — STOP

When the requested work is implemented and verified:

STOP.

Do not continue with speculative improvements.

Do not start unrelated tasks.

Do not repeatedly run Git commands.

---

# 31. BUILD_STATUS.md

You MUST maintain BUILD_STATUS.md.

Before starting work:

Read BUILD_STATUS.md once.

After meaningful progress:

Update it.

Before ending the session:

Update it.

Keep it concise.

Track:

- ✅ Completed
- 🔄 In progress
- ⏳ Remaining
- 🚫 Blockers
- ➡️ Exact next step
- 💡 Important technical decisions

This is a checkpoint/handoff document.

It is NOT a transcript.

It is NOT a command log.

Never fill it with repetitive Git commands or terminal output.

---

# 32. CREDIT / API LIMITS

If Gemini, Google Cloud, Firebase, or another service approaches a quota/credit limit:

STOP unnecessary usage.

Record the issue in BUILD_STATUS.md.

Switch to:

- Mock data
- Local fixtures
- Cached responses
- Deterministic test data
- Local development

where possible.

Do NOT repeatedly call APIs to test the same functionality.

If a warning indicates credits are running low:

Preserve remaining credits for essential integration and demo testing.

---

# 33. DO NOT IMPLEMENT

Do NOT build:

- Central ADK agents
- Discovery agent logic
- Legitimacy agent logic
- Document agent logic
- Form automation agent
- IVR
- Async status engine
- Background polling
- Real government portal automation
- OTP bypass
- CAPTCHA bypass
- Independent Gemini orchestration
- A separate Firestore architecture

Those belong to other project responsibilities.

---

# 34. DEFINITION OF DONE

The frontend work is complete when:

- Existing landing page remains untouched
- Landing page can lead to Login / Sign Up
- Authentication flow works
- Authenticated product shell works
- Chat is the primary experience
- Explore works
- Applications works
- Chat ↔ Explore integration works
- Chat ↔ Applications integration works
- Agent states are visually represented
- Agent activity/progress is visible
- Application workflow is understandable
- Documents/status are understandable
- Loading/error/empty states exist
- Responsive behavior works
- Critical frontend tests pass
- API integration is clean
- BUILD_STATUS.md is updated
- No unnecessary Git operations were performed
- Visual styling uses centralized theme/design tokens
- No final color/font system is unnecessarily hard-coded

---

# 35. FINAL PRODUCT PRINCIPLE

Do NOT build:

> "A scholarship website with an AI chatbot."

Build:

> **"An agent interface that happens to have a website around it."**

The user should feel:

> "I told it what I need, and it is taking care of the process."

NOT:

> "I am navigating a scholarship website and occasionally asking AI for help."