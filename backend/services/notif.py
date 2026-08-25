"""
Notification events. Frontend polls/subscribes to these; the voice
branch (Person 3) can trigger an outbound call off action_required events.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid

_NOTIFICATIONS: list["Notification"] = []


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
        id=str(uuid.uuid4()),
        application_id=application_id,
        user_id=user_id,
        message=message,
        kind=kind,
    )
    _NOTIFICATIONS.append(note)
    return note


def list_notifications_for_user(user_id: str) -> list[Notification]:
    return [n for n in _NOTIFICATIONS if n.user_id == user_id]