"""
Pub/Sub service — thin wrapper for publishing async status-check triggers.

Person 4 (feature/status-documents) subscribes to the topic and builds the
scheduling logic. This module only publishes the trigger message.

Falls back to a no-op stub when PUBSUB_TOPIC or GCP credentials are absent.
"""

from __future__ import annotations

import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def publish_status_check_trigger(application_id: str) -> bool:
    """
    Publish a message to the Pub/Sub topic so Person 4's status-agent
    picks it up and checks the application status on the government portal.

    Returns True if published successfully, False if using no-op stub.
    """
    if not settings.pubsub_enabled:
        logger.info(
            "[PubSub stub] Would publish status-check trigger for application_id=%s",
            application_id,
        )
        return False

    try:
        from google.cloud import pubsub_v1  # type: ignore

        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(
            settings.google_cloud_project, settings.pubsub_topic
        )
        data = json.dumps({"application_id": application_id}).encode("utf-8")
        future = publisher.publish(topic_path, data)
        message_id = future.result(timeout=10)
        logger.info(
            "Published status-check trigger for application_id=%s, message_id=%s",
            application_id,
            message_id,
        )
        return True
    except Exception as exc:
        logger.error(
            "Failed to publish Pub/Sub message for application_id=%s: %s",
            application_id,
            exc,
        )
        return False
