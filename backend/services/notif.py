"""
Notification events. Storage routes through Firestore (collection
"notifications") when USE_FIRESTORE=true, otherwise in-memory.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid

from services.firestore_client import firestore_enabled, get_client

_NOTIFICATIONS: list["Notification"] = []
_COLLECTION = "notifications"


@dataclass
class Notification:
    id: str
    application_id: str
    user_id: str
    message: str
    kind: str
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def create_notification(application_id: str, user_id: str, message: str, kind: str) -> Notification:
    note = Notification(
        id=str(uuid.uuid4()), application_id=application_id, user_id=user_id,
        message=message, kind=kind,
    )
    if firestore_enabled():
        get_client().collection(_COLLECTION).document(note.id).set({
            "id": note.id, "application_id": note.application_id, "user_id": note.user_id,
            "message": note.message, "kind": note.kind, "created_at": note.created_at,
        })
    else:
        _NOTIFICATIONS.append(note)
    return note


def list_notifications_for_user(user_id: str) -> list[Notification]:
    if firestore_enabled():
        query = get_client().collection(_COLLECTION).where("user_id", "==", user_id)
        return [Notification(**snap.to_dict()) for snap in query.stream()]
    return [n for n in _NOTIFICATIONS if n.user_id == user_id]