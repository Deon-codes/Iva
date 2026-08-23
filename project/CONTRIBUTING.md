# Contributing to Hazela

This sprint moves at a fast pace over 5 days. To avoid code conflicts and build drift, we adhere to strict team boundaries and Git procedures.

---

## ⛔ Shared Scaffold Rule

The following files are **strictly protected** and should not be modified on any individual feature branch:
- `project/backend/app/main.py`
- `project/requirements.txt`
- `project/package.json`
- `project/docs/architecture.md`

### To propose changes to shared files:
1. Contact the assigned **Scaffolding Owner** (Lead Integration Engineer).
2. The owner will review, apply changes, and merge them directly to `main` via a fast-tracked PR.
3. Once merged to `main`, all developers must immediately pull `main` and merge it into their feature branches:
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch-name
   git merge main
   ```

---

## 🌿 Feature Branch Lanes

Each team member owns a specific branch and directory subset. Do not write or commit code outside your lanes.

### 1. `feature/agent-core`
- **Owner:** Lead AI Engineer
- **Lanes:** `project/backend/agents/`, `project/backend/services/agent/`

### 2. `feature/frontend-user-flow`
- **Owner:** Frontend Specialist
- **Lanes:** `project/frontend/`, `project/backend/routes/user/`, `project/backend/routes/applications/`

### 3. `feature/voice-ivr`
- **Owner:** Voice Systems Developer
- **Lanes:** `project/backend/routes/voice/`, `project/backend/services/voice/`

### 4. `feature/status-documents`
- **Owner:** Integration Engineer
- **Lanes:** `project/backend/services/documents/`, `project/backend/services/status/`, `project/backend/jobs/`, `project/backend/tests/integration/`

---

## 🔄 Daily Merge Routine

To maintain velocity, we execute integration checkpoint merges at the end of **Day 1, Day 2, and Day 3**.

1. Keep your branch code updated with the latest from `main` (merge main into feature daily).
2. Open Pull Requests early and assign the integration owner for review.
3. Resolve any merge conflicts locally before requesting code reviews.
