# Hazela Architecture & Shared Contracts

This document contains the shared contract for all feature branches. Any modifications to this file must be reviewed and approved by the team lead and merged via a small, fast-tracked PR.

---

## 1. API Endpoints

### Health Check
- **Path:** `/health`
- **Method:** `GET`
- **Request:** None
- **Response:**
  ```json
  {
    "status": "ok",
    "environment": "development"
  }
  ```

### User Profiles
- **Path:** `/api/v1/user/profile`
- **Method:** `GET`
- **Request:** None (uses Auth header)
- **Response:**
  ```json
  {
    "id": "usr_abc123",
    "name": "Deon Raj",
    "email": "deon@example.com",
    "status": "active",
    "created_at": "2026-08-23T22:55:00Z"
  }
  ```

### Applications
- **Path:** `/api/v1/applications`
- **Method:** `POST`
- **Request:**
  ```json
  {
    "user_id": "usr_abc123",
    "type": "standard",
    "metadata": {
      "source": "web_wizard"
    }
  }
  ```
- **Response:**
  ```json
  {
    "application_id": "app_6521",
    "user_id": "usr_abc123",
    "type": "standard",
    "status": "DRAFT",
    "created_at": "2026-08-23T22:55:00Z",
    "updated_at": "2026-08-23T22:55:00Z"
  }
  ```

- **Path:** `/api/v1/applications/{app_id}`
- **Method:** `GET`
- **Request:** None
- **Response:**
  ```json
  {
    "application_id": "app_6521",
    "user_id": "usr_abc123",
    "type": "standard",
    "status": "DRAFT",
    "documents": [],
    "history": [
      {
        "status": "DRAFT",
        "changed_by": "usr_abc123",
        "timestamp": "2026-08-23T22:55:00Z"
      }
    ],
    "created_at": "2026-08-23T22:55:00Z",
    "updated_at": "2026-08-23T22:55:00Z"
  }
  ```

- **Path:** `/api/v1/applications/{app_id}`
- **Method:** `PUT`
- **Request:**
  ```json
  {
    "status": "SUBMITTED",
    "documents": ["doc_xyz789"]
  }
  ```
- **Response:**
  ```json
  {
    "application_id": "app_6521",
    "status": "SUBMITTED",
    "updated_at": "2026-08-23T22:55:20Z"
  }
  ```

### Voice / IVR
- **Path:** `/api/v1/voice/webhook`
- **Method:** `POST`
- **Request:** Form URL-Encoded (Twilio standard webhook payload including `CallSid`, `From`, `To`, `Digits`)
- **Response:** XML Content-Type (TwiML response)
  ```xml
  <Response>
      <Say>Connecting to Hazela voice core...</Say>
  </Response>
  ```

- **Path:** `/api/v1/voice/call`
- **Method:** `POST`
- **Request:**
  ```json
  {
    "to_phone_number": "+1234567890",
    "message": "Greetings from Hazela"
  }
  ```
- **Response:**
  ```json
  {
    "call_sid": "CAabcdef1234567890",
    "status": "queued"
  }
  ```

### Document Uploads
- **Path:** `/api/v1/documents/upload`
- **Method:** `POST`
- **Request:** Multipart form upload (`file`)
- **Response:**
  ```json
  {
    "document_id": "doc_xyz789",
    "filename": "tax_return.pdf",
    "url": "https://storage.googleapis.com/hazela-bucket/tax_return.pdf",
    "status": "PENDING_VERIFICATION",
    "created_at": "2026-08-23T22:55:00Z"
  }
  ```

---

## 2. Firestore Schema

### Collection: `users`
- `id` (String, PK) - Unique user identifier
- `name` (String) - User's full name
- `email` (String) - User's email address
- `role` (String) - User role (e.g. `'developer'`, `'admin'`, `'applicant'`)
- `status` (String) - Current user status (e.g. `'active'`, `'disabled'`)
- `created_at` (Timestamp) - Record creation time

### Collection: `applications`
- `id` (String, PK) - Unique application identifier
- `user_id` (String, FK) - Reference to `users.id`
- `status` (String) - State value from the application state machine
- `type` (String) - Application type
- `documents` (Array of Strings) - Array of document IDs uploaded
- `history` (Array of Maps) - Changelog history of the application
  - `status` (String) - State value
  - `changed_by` (String) - User ID who triggered the transition
  - `timestamp` (Timestamp) - Transition time
- `created_at` (Timestamp) - Creation time
- `updated_at` (Timestamp) - Modification time

### Collection: `documents`
- `id` (String, PK) - Unique document identifier
- `application_id` (String, FK) - Reference to `applications.id`
- `filename` (String) - File name as uploaded
- `url` (String) - GCS path / download link
- `status` (String) - Verification status (e.g. `'PENDING'`, `'VERIFIED'`, `'REJECTED'`)
- `extracted_data` (Map) - Data parsed by agent core (e.g. name, dates, income)
- `created_at` (Timestamp) - Creation time

---

## 3. Application Status State Machine

The following is the state machine for application processing.

```
       [ DRAFT ]
           │ (Submit Application)
           ▼
     [ SUBMITTED ]
           │ (Integration check triggers / Agent parsing)
           ▼
    [ UNDER_REVIEW ] ◄─────────────────────────┐
      /          \                             │ (Resubmit Docs)
     /            \                            │
    ▼              ▼                           │
[ APPROVED ]  [ ACTION_REQUIRED ] ─────────────┘
                   │ (Timeout / Failure to resolve)
                   ▼
              [ REJECTED ]
```

### Valid Status Values:
1. `DRAFT`: Created, not yet submitted.
2. `SUBMITTED`: Submitted by user, awaiting agent parser/verification.
3. `UNDER_REVIEW`: AI Agent or human reviewer is validating documents and details.
4. `ACTION_REQUIRED`: Document failed verification; applicant needs to upload replacement.
5. `APPROVED`: Successfully passed all criteria and completed.
6. `REJECTED`: Disapproved / closed permanently.

---

## 4. Agent Interface Definitions

The Agent Core defines the following abstract class contract. The `feature/agent-core` branch must implement this class in `backend/agents/core.py`.

```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAgent(ABC):
    """
    Abstract interface for Hazela AI Agent Core.
    All agent implementations must conform to this contract.
    """

    @abstractmethod
    def process_message(self, user_id: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a user input chat message and return the agent response.
        
        Args:
            user_id: The ID of the user sending the message
            message: The raw user message string
            context: Execution context containing application and session state
            
        Returns:
            Dict containing:
                - "response_text": (str) The markdown response for the user
                - "actions": (list) List of tool executions / calls triggered
                - "status_update": (str | None) Any application status update proposed
        """
        pass

    @abstractmethod
    def analyze_document(self, document_id: str, document_url: str) -> Dict[str, Any]:
        """
        Analyze an uploaded document, extracting key fields and verifying metadata.
        
        Args:
            document_id: The unique identifier of the document
            document_url: URL to download/view the document
            
        Returns:
            Dict containing:
                - "is_valid": (bool) Whether the document is readable and correct
                - "extracted_fields": (dict) Extracted key-value pairs
                - "confidence_score": (float) AI parser confidence score (0.0 to 1.0)
                - "validation_error": (str | None) Human readable failure reason if not valid
        """
        pass
```

---

## 5. Environment Variables Reference

| Variable Name | Purpose / Usage | Expected Value Example |
| :--- | :--- | :--- |
| `PORT` | Local server port for FastAPI backend | `8000` |
| `HOST` | Bind address for FastAPI backend | `0.0.0.0` |
| `FIRESTORE_PROJECT_ID` | Project ID for Firebase/Firestore databases | `hazela-dev-project` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Absolute path to Google Service Account JSON key file | `C:\keys\gcp-service.json` |
| `OPENAI_API_KEY` | Secret API key for OpenAI LLM services | `sk-proj-4929...` |
| `AGENT_MODEL_NAME` | Model choice for LLM generation | `gpt-4-turbo` or `gpt-4o` |
| `TWILIO_ACCOUNT_SID` | SID for Twilio integration | `AC1234567890abcdef` |
| `TWILIO_AUTH_TOKEN` | Auth token for Twilio voice integrations | `auth_token_secret_123` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for outbound calls | `+15017122661` |
| `DOCUMENT_BUCKET_NAME` | Google Cloud Storage bucket for PDF/image uploads | `hazela-uploads-prod` |
| `CRON_JOB_INTERVAL_SECONDS` | Run interval for background status jobs | `300` |
