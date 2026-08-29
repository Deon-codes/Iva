"""
Standalone runnable app for THIS branch (feature/status-documents).

Run:
    uvicorn dev_app:app --reload

Then open http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI

from routes.applic import router as applic_router
from routes.status_route import router as status_router
from routes.doc import router as doc_router

app = FastAPI(title="Status & Documents — dev server")
app.include_router(applic_router)
app.include_router(status_router)
app.include_router(doc_router)


@app.get("/health")
def health():
    return {"ok": True}