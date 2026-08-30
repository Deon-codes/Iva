"""
Firestore service — full CRUD for all collections.

Falls back automatically to an in-memory dict stub when Firestore credentials
are not configured, so local development and CI tests work without GCP access.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# In-memory stub (used when Firestore credentials are absent)
# ─────────────────────────────────────────────────────────────────────────────

class _InMemoryStore:
    """Thread-unsafe in-memory store for local dev / testing."""

    def __init__(self) -> None:
        self._data: Dict[str, Dict[str, Any]] = {
            "users": {},
            "schemes": {},
            "documents": {},
            "applications": {},
            "application_events": {},
            "chat_sessions": {},
        }

    def get(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        return self._data.get(collection, {}).get(doc_id)

    def set(self, collection: str, doc_id: str, data: Dict[str, Any]) -> None:
        self._data.setdefault(collection, {})[doc_id] = data

    def list(self, collection: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        docs = list(self._data.get(collection, {}).values())
        if filters:
            for k, v in filters.items():
                docs = [d for d in docs if d.get(k) == v]
        return docs

    def delete(self, collection: str, doc_id: str) -> None:
        self._data.get(collection, {}).pop(doc_id, None)


_stub = _InMemoryStore()


# ─────────────────────────────────────────────────────────────────────────────
# Firestore client factory
# ─────────────────────────────────────────────────────────────────────────────

_firestore_client = None


def _get_client():
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client
    if not settings.firestore_enabled:
        return None
    try:
        from google.cloud import firestore  # type: ignore
        _firestore_client = firestore.AsyncClient(
            project=settings.google_cloud_project,
            database=settings.firestore_database_id,
        )
        logger.info("Firestore client initialised (project=%s)", settings.google_cloud_project)
        return _firestore_client
    except Exception as exc:
        logger.error("Failed to initialise Firestore client: %s — using in-memory stub", exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────

async def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.get("users", user_id)
    doc = await client.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


async def upsert_user(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    data = {**data, "id": user_id, "updated_at": datetime.utcnow().isoformat()}
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow().isoformat()
    client = _get_client()
    if client is None:
        _stub.set("users", user_id, data)
        return data
    await client.collection("users").document(user_id).set(data, merge=True)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# Schemes
# ─────────────────────────────────────────────────────────────────────────────

async def get_scheme(scheme_id: str) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.get("schemes", scheme_id)
    doc = await client.collection("schemes").document(scheme_id).get()
    return doc.to_dict() if doc.exists else None


async def list_schemes() -> List[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.list("schemes")
    docs = client.collection("schemes").stream()
    return [doc.to_dict() async for doc in docs]


async def upsert_scheme(scheme_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    client = _get_client()
    if client is None:
        _stub.set("schemes", scheme_id, data)
        return data
    await client.collection("schemes").document(scheme_id).set(data, merge=True)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# Applications
# ─────────────────────────────────────────────────────────────────────────────

async def create_application(user_id: str, scheme_id: str) -> Dict[str, Any]:
    app_id = f"app_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    data: Dict[str, Any] = {
        "id": app_id,
        "userId": user_id,
        "schemeId": scheme_id,
        "status": "draft",
        "submittedAt": None,
        "rejectionReason": None,
        "nextAction": None,
        "form_data": {},
        "documents": [],
        "created_at": now,
        "updated_at": now,
    }
    client = _get_client()
    if client is None:
        _stub.set("applications", app_id, data)
        return data
    await client.collection("applications").document(app_id).set(data)
    return data


async def get_application(application_id: str) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.get("applications", application_id)
    doc = await client.collection("applications").document(application_id).get()
    return doc.to_dict() if doc.exists else None


async def list_applications_for_user(user_id: str) -> List[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.list("applications", filters={"userId": user_id})
    docs = client.collection("applications").where("userId", "==", user_id).stream()
    return [doc.to_dict() async for doc in docs]


async def update_application_status(
    application_id: str,
    status: str,
    rejection_reason: Optional[str] = None,
    next_action: Optional[str] = None,
    form_data: Optional[Dict[str, Any]] = None,
    submitted_at: Optional[datetime] = None,
) -> Optional[Dict[str, Any]]:
    updates: Dict[str, Any] = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat(),
    }
    if rejection_reason is not None:
        updates["rejectionReason"] = rejection_reason
    if next_action is not None:
        updates["nextAction"] = next_action
    if form_data is not None:
        updates["form_data"] = form_data
    if submitted_at is not None:
        updates["submittedAt"] = submitted_at.isoformat()

    client = _get_client()
    if client is None:
        existing = _stub.get("applications", application_id)
        if existing is None:
            return None
        existing.update(updates)
        _stub.set("applications", application_id, existing)
        return existing
    ref = client.collection("applications").document(application_id)
    await ref.update(updates)
    doc = await ref.get()
    return doc.to_dict()


# ─────────────────────────────────────────────────────────────────────────────
# Application Events (sub-collection)
# ─────────────────────────────────────────────────────────────────────────────

async def append_application_event(
    application_id: str,
    event_type: str,
    message: str,
    triggered_by: str = "agent",
    **extra: Any,
) -> Dict[str, Any]:
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    event: Dict[str, Any] = {
        "event_id": event_id,
        "application_id": application_id,
        "event_type": event_type,
        "message": message,
        "triggered_by": triggered_by,
        "timestamp": datetime.utcnow().isoformat(),
        **extra,
    }
    client = _get_client()
    if client is None:
        composite_key = f"{application_id}_{event_id}"
        _stub.set("application_events", composite_key, event)
        return event
    await (
        client.collection("applications")
        .document(application_id)
        .collection("events")
        .document(event_id)
        .set(event)
    )
    return event


# ─────────────────────────────────────────────────────────────────────────────
# Documents
# ─────────────────────────────────────────────────────────────────────────────

async def create_document(data: Dict[str, Any]) -> Dict[str, Any]:
    doc_id = data.get("id") or f"doc_{uuid.uuid4().hex[:8]}"
    data = {**data, "id": doc_id, "created_at": datetime.utcnow().isoformat()}
    client = _get_client()
    if client is None:
        _stub.set("documents", doc_id, data)
        return data
    await client.collection("documents").document(doc_id).set(data)
    return data


async def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.get("documents", document_id)
    doc = await client.collection("documents").document(document_id).get()
    return doc.to_dict() if doc.exists else None


async def list_documents_for_user(user_id: str) -> List[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.list("documents", filters={"user_id": user_id})
    docs = client.collection("documents").where("user_id", "==", user_id).stream()
    return [doc.to_dict() async for doc in docs]


# ─────────────────────────────────────────────────────────────────────────────
# Chat Sessions (in-memory persistence for dev)
# ─────────────────────────────────────────────────────────────────────────────


async def create_chat_session(user_id: str, session_id: str, title: str = "New chat") -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()
    data: Dict[str, Any] = {
        "id": session_id,
        "user_id": user_id,
        "title": title,
        "messages": [],
        "created_at": now,
        "updated_at": now,
    }
    client = _get_client()
    if client is None:
        _stub.set("chat_sessions", session_id, data)
        return data
    await client.collection("chat_sessions").document(session_id).set(data)
    return data


async def get_chat_session(session_id: str) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return _stub.get("chat_sessions", session_id)
    doc = await client.collection("chat_sessions").document(session_id).get()
    return doc.to_dict() if doc.exists else None


async def append_chat_message(session_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
    client = _get_client()
    if client is None:
        existing = _stub.get("chat_sessions", session_id)
        if existing is None:
            return {}
        existing["messages"].append(message)
        existing["updated_at"] = datetime.utcnow().isoformat()
        _stub.set("chat_sessions", session_id, existing)
        return existing
    ref = client.collection("chat_sessions").document(session_id)
    doc = await ref.get()
    if not doc.exists:
        return {}
    data = doc.to_dict()
    data["messages"].append(message)
    data["updated_at"] = datetime.utcnow().isoformat()
    await ref.set(data)
    return data


async def update_chat_session_title(session_id: str, title: str) -> None:
    client = _get_client()
    if client is None:
        existing = _stub.get("chat_sessions", session_id)
        if existing:
            existing["title"] = title
            _stub.set("chat_sessions", session_id, existing)
        return
    await client.collection("chat_sessions").document(session_id).update({"title": title})


async def list_chat_sessions_for_user(user_id: str) -> List[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        sessions = _stub.list("chat_sessions", filters={"user_id": user_id})
        sessions.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
        return sessions
    docs = client.collection("chat_sessions").where("user_id", "==", user_id).stream()
    sessions = [doc.to_dict() async for doc in docs]
    sessions.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
    return sessions


# ─────────────────────────────────────────────────────────────────────────────
# Expose stub for tests
# ─────────────────────────────────────────────────────────────────────────────

def get_stub() -> _InMemoryStore:
    """Return the in-memory stub — useful for test setup/teardown."""
    return _stub
