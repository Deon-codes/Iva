"""
BaseAgent — implements the abstract contract defined in docs/architecture.md.

All concrete agents inherit from this class to satisfy the shared team contract.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract interface for Hazela AI Agent Core.
    All agent implementations must conform to this contract.
    Defined in docs/architecture.md § 4.
    """

    @abstractmethod
    async def process_message(
        self, user_id: str, message: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a user input chat message and return the agent response.

        Args:
            user_id: The ID of the user sending the message.
            message: The raw user message string.
            context: Execution context containing application and session state.

        Returns:
            Dict containing:
                - "response_text": (str) The markdown response for the user.
                - "actions": (list) List of tool executions / calls triggered.
                - "status_update": (str | None) Any application status update proposed.
        """

    @abstractmethod
    async def analyze_document(
        self, document_id: str, document_url: str
    ) -> Dict[str, Any]:
        """
        Analyze an uploaded document, extracting key fields and verifying metadata.

        Args:
            document_id: The unique identifier of the document.
            document_url: URL to download/view the document.

        Returns:
            Dict containing:
                - "is_valid": (bool) Whether the document is readable and correct.
                - "extracted_fields": (dict) Extracted key-value pairs.
                - "confidence_score": (float) AI parser confidence score (0.0 to 1.0).
                - "validation_error": (str | None) Human-readable failure reason if not valid.
        """
