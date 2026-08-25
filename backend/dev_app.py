"""
Standalone runnable app for THIS branch (feature/status-documents) so you
can test your slice independently before it's wired into the shared
backend/main.py.

Run:
    uvicorn backend.dev_app:app --reload

Then open http://127.0.0.1:8000/docs for interactive Swagger UI.

NOTE: this file is a dev convenience, not the shared entrypoint --
don't merge this into backend/main.py yourself; hand your router
(status_routes.router) to whoever owns main.py to include instead.
"""

from fastapi import FastAPI

from routes.status_route import router as status_router

app = FastAPI(title="Status & Documents — dev server")
app.include_router(status_router)


@app.get("/health")
def health():
    return {"ok": True}