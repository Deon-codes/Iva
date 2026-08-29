# BUILD_STATUS — Person 4 (Documents + Async Status + Testing)

Last updated: this session (pytest integration suite added, gap audit against full spec done)

## ✅ Completed

- Application state machine — all 8 states, invalid transitions blocked (`models/application.py`)
- Mock government portal (`services/mock_government_portal.py`)
- Async status checker — `check_application_status(application_id)`, idempotent no-op when nothing changed (`agents/status_agent.py`)
- Rejection/action-required explanation via Gemini, deterministic offline fallback when no API key set
- Correction drafts — `CorrectionDraft` model; known issues return which document to re-upload; unknown reasons return `fixable: False` rather than guessing
- Event timeline (`StatusEvent`, includes `correction_draft`)
- Notification events
- Document intelligence (`models/document.py`, `services/doc_service.py`):
  - metadata model + storage
  - matching against a scheme's required list (✓/✗ + human-readable summary)
  - expiry detection — `EXPIRED` vs `EXPIRES_BEFORE_DEADLINE` (only computed off a real deadline, never invented)
- FastAPI routes split correctly: `routes/applic.py` (application CRUD), `routes/status_route.py` (status check, mock gov, notifications), `routes/doc.py` (document upload/list/match)
- `dev_app.py` wires all three routers
- **Automated integration test suite** (`tests/test_documents.py`, `tests/test_status_flow.py`) — 15 tests, all passing, covering every item in the spec's "Also test" list: missing document, expired document, approved application, rejected application, invalid state transition, duplicate status event, retry behavior (repeated polling over simulated time), full end-to-end lifecycle
- Manual Swagger walkthrough verified against the same scenarios

## ❌ Not done — real gaps against the spec, not just polish

1. **Firestore.** Spec explicitly requires document metadata (and by extension application/event data) to live in Firestore. Everything is currently in-memory `dict`s. This is the single biggest remaining infra gap.
2. **Cloud Scheduler / Pub-Sub wiring.** `check_application_status` is a plain callable + manual HTTP trigger only. Nothing is actually scheduled yet.
3. **Gemini document _interpretation_.** Matching/expiry are correctly deterministic (per spec). But the spec also asks for Gemini to interpret/extract fields from an uploaded document — right now `POST /api/documents` only accepts already-structured input (type, dates typed in directly), there's no extraction step. This is a real feature gap, not just infra.
4. **Recorded evidence of background execution for the demo.** Can be proven live, but no saved artifact (log capture / recording) exists yet — lower priority, do closer to Day 4/5.

## 🔄 Partial

- Rejection/action reason matching (`_KNOWN_ISSUES` in `status_agent.py`) only covers 4 hardcoded reasons — fine for the demo script, untested against arbitrary portal responses.
- Gemini call uses `google.generativeai` + `gemini-1.5-flash` — not yet confirmed this matches whatever Person 1 standardizes on (ADK vs direct SDK) for the rest of the team.

## 🚫 Blockers

None currently.

## 💡 Decisions made (don't redo/undo without reason)

- Deleted `services/status_check.py` (empty stub) — orchestration intentionally lives in `agents/status_agent.py`.
- Matching/expiry logic is deliberately deterministic (no Gemini) per spec instruction.
- Correction drafts only claim `fixable: True` for reasons in the known-issues map.
- `dev_app.py` is dev-only, not meant to merge into the shared `backend/main.py` — hand the three routers to whoever owns `main.py`.
- In-memory storage was a deliberate choice for iteration speed — swap point is isolated to each service file's `_store` dict, contained change when we do it.

## ➡️ Next step

Priority order for remaining time: (1) Firestore swap — contained, mechanical, do it once matching/status logic is stable (it is); (2) Gemini document interpretation — the one actual missing feature; (3) real Cloud Scheduler wiring — can reasonably wait until Day 4 integration per the team's own "don't build cloud infra too early" plan.
