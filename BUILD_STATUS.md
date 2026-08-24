# BUILD_STATUS.md — Hazela Agent Core (`feature/agent-core`)

> Read this before every session. Update after every meaningful milestone.
> Never mark something ✅ unless it is implemented **AND** tested.

---

## ✅ Completed Work

- Project scaffold exists: FastAPI skeleton, shared architecture docs, .gitignore, .env.example
- **AGENTS.md** dropped at repo root (full spec)
- **requirements.txt** updated: ADK, Gemini SDK, Firestore, Pub/Sub, httpx, pytest
- **.env.example** updated to Gemini/GCP keys (OpenAI removed)
- **Pydantic models**: User, Scheme, Application, Document, Chat — all typed, shared contract shape locked
- **Firestore service** (`firestore_service.py`): full CRUD, in-memory stub for local/CI use
- **Scheme data fixture** (`scheme_data.py`): 3 real schemes (PM NSP, Maharashtra Rajarshi Shahu, AICTE Pragati)
- **Pub/Sub service** (`pubsub_service.py`): thin wrapper + no-op stub
- **Agent tools**: scheme_tools, legitimacy_tools, profile_tools, application_tools, status_tools
- **Discovery Agent**: LlmAgent over Gemini 2.0 Flash + RAG over scheme fixture
- **Legitimacy Agent**: deterministic pre-check rules + Gemini for explanation
- **Form-Prep Agent**: profile→fields mapping, hard stop before OTP
- **Orchestrator**: root LlmAgent wiring all sub-agents via ADK
- **ADK Runner**: `run_agent()` async entrypoint
- **Mock Government Portal** (`mock_portal/portal.py`)
- **API routes**: /api/chat, /api/profile, /api/schemes, /api/applications, /api/voice/session, /api/documents, /api/internal/status/trigger
- **main.py** promoted: lifespan startup, all routers registered, CORS configured
- **Test suite**: conftest, test_agents, test_api, test_firestore (all run on mocks)
- **Dockerfile** + .dockerignore + cloudbuild.yaml
- **docs/deployment.md** — Cloud Run deployment guide

---

## 🔄 In Progress / Partially Done

- Firestore **live** connection: code ready, waiting for `GOOGLE_APPLICATION_CREDENTIALS` from operator
- Gemini **live** calls: code ready, waiting for `GEMINI_API_KEY` from operator
- Cloud Run deployment: Dockerfile and cloudbuild.yaml ready — needs GCP project set up

---

## ⏳ Remaining Work

- [ ] **Day 2**: Test full Discovery → Legitimacy chain with real Gemini API key
- [ ] **Day 3**: Run Form-Prep → Mock Portal flow end-to-end (needs Gemini key)
- [ ] **Day 4**: Deploy to Cloud Run (`asia-south1`), verify Firestore + Gemini in that env
- [ ] **Day 4**: Support Person 3 IVR hookup (`POST /api/voice/session`)
- [ ] **Day 4**: Support Person 4 status-agent integration (`POST /api/internal/status/trigger`)
- [ ] **Day 5**: Bug fixes only. Freeze features.

---

## 🚫 Blockers or Issues

- **`GEMINI_API_KEY` not set** → agents run in mock-response mode. Get key from https://aistudio.google.com
- **`GOOGLE_APPLICATION_CREDENTIALS` not set** → Firestore uses in-memory stub. Download service account from GCP Console.

---

## ➡️ Exact Next Step

1. Create `.env` from `.env.example` and fill in `GEMINI_API_KEY` + `GOOGLE_CLOUD_PROJECT` + `GOOGLE_APPLICATION_CREDENTIALS`
2. `pip install -r requirements.txt`
3. `cd backend && python -m pytest tests/ -v` → all tests should pass (mock mode)
4. `uvicorn app.main:app --reload` → hit `POST /api/chat` with a real scholarship question

---

## 💡 Technical Decisions Already Made (do not relitigate)

- **Model**: `gemini-2.0-flash` — fast, cheap, sufficient for hackathon demo
- **ADK pattern**: `LlmAgent` + `Runner` + `InMemorySessionService` (dev), swap to Firestore-backed sessions for prod
- **3 MVP schemes**: PM NSP (central, income ≤ ₹2.5L), Maharashtra Rajarshi Shahu (state, SC/ST), AICTE Pragati (central, women in tech)
- **Firestore stub**: auto-activates when credentials absent — tests never need GCP
- **Legitimacy rules are deterministic**: Gemini only explains, rules decide — never the other way round
- **Hard stop at OTP**: Form-Prep Agent returns a `PreparedForm` for user review; never submits to real portal
- **API versioning**: `/api/` prefix, no version segment yet (per team contract — add v1 prefix only if team agrees)
