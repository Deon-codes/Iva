# AGENTS.md — Agent Core & Google Cloud (Person 1 Branch)

## Mission
Own the central AI/agent backend for the Agentic Government Schemes & Scholarships
Platform. The product helps users: **Discover → Verify → Prepare → Apply → Track → Resolve**.

The system must be genuinely agentic: Gemini + Google ADK reason, select tools/sub-agents,
perform permitted actions, and continue workflows — not hardcoded if/else dressed up as
agents. The system should demonstrate: **goal → reasoning → tool/agent → result → next action.**

## Hackathon Context
- Event: Google All Things Agentic Hackathon (submissions due Aug 31, 2026)
- Track: Taskmaster (complete workflow, agent takes real action — not just conversational Q&A)
- Mandatory tech: Gemini 2.0+, Google ADK, at least one Google Cloud service
- Does NOT need to stay publicly live at judging time — demo video + code repo is sufficient

## Ownership (this branch — `feature/agent-core`)
- Google ADK architecture
- Gemini integration
- Main orchestrator
- Discovery/Eligibility Agent
- Legitimacy Agent
- Form-Preparation Agent
- Core agent tools & backend services
- Firestore integration
- Cloud Run deployment
- Shared backend agent interfaces (the API the rest of the team calls)

## Explicitly NOT this branch
- React frontend → Person 2 (`feature/frontend-user-flow`)
- IVR/telephony (Twilio/Exotel/WhatsApp/Telegram) → Person 3 (`feature/voice-ivr`)
- Document-processing implementation (OCR, doc vault) → Person 4 (`feature/status-documents`)
- Async status implementation → Person 4 (you only expose the trigger point:
  `check_application_status(application_id)` — the scheduler/Pub-Sub wiring around it is theirs)

## Team Coordination

| Person | Branch | Owns |
|---|---|---|
| 1 (you) | `feature/agent-core` | ADK, Gemini, orchestrator, Discovery/Legitimacy/Form agents, Firestore, Cloud Run |
| 2 | `feature/frontend-user-flow` | React UI, dashboard, chat, application workspace |
| 3 | `feature/voice-ivr` | Twilio/Exotel IVR, calls into your agent backend |
| 4 | `feature/status-documents` | Document vault/OCR, async status agent, integration testing |

**Shared files — do not edit casually, flag changes to the team first:**
`README.md`, `requirements.txt`, `.env.example`, `backend/main.py`, any shared Firestore model/schema.

**API contract everyone builds against from Day 1 — do not rename/restructure without team sign-off:**
```
POST /api/chat
POST /api/profile        GET /api/profile
GET  /api/schemes        GET /api/schemes/{id}
POST /api/applications   GET /api/applications   GET /api/applications/{id}
POST /api/voice/session  (Person 3 hits this)
POST /api/documents      GET /api/documents       (Person 4 hits this)
```

**Shared application object shape** (Person 2's UI and Person 4's status agent both depend on this exact structure):
```json
{
  "id": "app_001",
  "userId": "user_001",
  "schemeId": "scheme_001",
  "status": "action_required",
  "submittedAt": null,
  "rejectionReason": null,
  "nextAction": "Upload income certificate"
}
```

**Merge discipline before any PR:** `git pull` → `rebase main` → run tests → fix conflicts →
run tests again → push → PR. Never let branches collide on the last day.

## Required Technology
- Gemini 2.0 Flash or newer
- Google ADK
- FastAPI/Python
- Firestore
- Cloud Run
- Pub/Sub or Cloud Scheduler — only where required by the async status system (Person 4's trigger)
- Environment variables + Secret Manager for all secrets — never hardcode API keys

## Agent Architecture
```
User → ADK Orchestrator → { Discovery Agent, Legitimacy Agent, Form-Preparation Agent }
     → Tools / Services → Firestore / approved external sources
```
The orchestrator decides which agent/tool applies. **Do not create fake multi-agent
behavior where everything is just hardcoded routing.**

## Discovery Agent
Support: user profile understanding, scheme eligibility matching, scheme retrieval,
eligibility reasoning, deadline awareness, required-document identification.

- MVP: only 3 carefully selected real schemes/scholarships.
- Structured scheme schema: name, department, description, eligibility, state, age,
  income, education, category, benefits, required documents, deadline, official source URL.
- Never invent scheme information.
- Simple RAG/retrieval layer: user asks "which scholarship can I apply for?" →
  retrieve relevant scheme data → Gemini reasons over it.

## Legitimacy Agent
Verify whether a scheme/scholarship appears legitimate, using trusted references:
myScheme.gov.in, PIB Fact Check, official government domains.

Explicit rules (deterministic, not Gemini judgment calls):
- upfront processing fee → suspicious
- unofficial domain → warning
- unsupported scheme name → warning
- conflicting information → flag for human verification

**Gemini alone never proves legitimacy** — it explains/summarises; the rules decide.
Always preserve and surface the source/reference used for the result.

## Form-Preparation Agent
1. Determine required fields
2. Read the user's saved profile
3. Read available document metadata
4. Map information to application fields
5. Prepare the application
6. Fill the hackathon's mock government portal
7. Present the completed form for review

**Hard stop before:** OTP / identity verification / final submission.
**Never bypass:** Aadhaar OTP, CAPTCHA, identity verification, or any other government
security control.

## Firestore
Collections: `users`, `schemes`, `documents`, `applications`, `application_events`
```
users/{userId}
schemes/{schemeId}
documents/{documentId}
applications/{applicationId}
applications/{applicationId}/events/{eventId}
```

## Cloud Run
Provide: Dockerfile, health endpoint, environment variable configuration, deployment
instructions, production-safe error handling.

## 5-Day Cadence

**Day 1 — Foundation:** FastAPI skeleton + ADK wired + one working Gemini call through
ADK + Firestore connected + a trivial orchestrator with one dummy sub-agent proven
end-to-end. Scheme schema defined.

**Day 2 — Core functionality:** Real Discovery → Eligibility → Legitimacy chain with
3 real schemes. Demoable: "student from Maharashtra" → eligible schemes → legitimacy result.

**Day 3 — The agentic part:** Form-Preparation Agent complete — profile + documents →
filled mock portal → hard stop at OTP/review screen.

**Day 4 — Integration + Cloud + Demo prep:** Deploy to Cloud Run. Support Person 3's IVR
hookup and Person 4's status-agent integration.

**Day 5 — Freeze + test + submission:** Only bug fixes.

## BUILD_STATUS.md Protocol (mandatory)
Read `BUILD_STATUS.md` before starting any session. Update it after every meaningful
milestone and before ending any session.

Structure:
- ✅ Completed work
- 🔄 In progress / partially done
- ⏳ Remaining work
- 🚫 Blockers or issues
- ➡️ Exact next step for the next session
- 💡 Technical decisions already made

## Environment Variables
```
GEMINI_API_KEY=              # from Google AI Studio
GOOGLE_CLOUD_PROJECT=        # your GCP project ID
GOOGLE_APPLICATION_CREDENTIALS=  # path to Firestore service account JSON
FIRESTORE_DATABASE_ID=       # usually "(default)"
```

## Definition of Done
Gemini works · ADK works · orchestrator works · discovery agent works · legitimacy
agent works · form-preparation agent works · Firestore works · mock application flow
works · async status trigger works · Cloud Run deployment works · tests pass ·
documentation is updated
