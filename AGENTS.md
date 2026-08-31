# AGENTS.md — Iva Integration Branch

This document consolidates the agent core (Person 1) and frontend (Person 2) ownership.

---

## Agent Core (Person 1)

Owns: ADK, Gemini, orchestrator, Discovery/Legitimacy/Form agents, Firestore, Cloud Run.

### API Contract
```
POST /api/chat
POST /api/profile        GET /api/profile
GET  /api/schemes        GET /api/schemes/{id}
POST /api/applications   GET /api/applications   GET /api/applications/{id}
POST /api/documents      GET /api/documents
POST /api/voice/session  (Person 3 hits this)
```

---

## Frontend (Person 2)

Owns: Next.js UI, dashboard, chat, application workspace, onboarding, explore, documents.

### Integration Notes
- Frontend proxies through Next.js API routes to the FastAPI backend.
- Backend runs on port 8000, frontend on port 3000.
- Firebase Auth for authentication; user_id passed to backend via API routes.
- Session persistence for chat handled in AppContext via localStorage.
