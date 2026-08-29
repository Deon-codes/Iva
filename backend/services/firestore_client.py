"""
Firestore client factory.

Storage only routes through Firestore when USE_FIRESTORE=true is set in
the environment. Off by default so local dev and the pytest suite keep
using fast in-memory dicts with zero setup and zero cost.

To turn it on:
    1. gcloud auth application-default login
       (or set GOOGLE_APPLICATION_CREDENTIALS to a service account key)
    2. set USE_FIRESTORE=true  (PowerShell: $env:USE_FIRESTORE = "true")
"""

from __future__ import annotations

import os
from functools import lru_cache


def firestore_enabled() -> bool:
    return os.environ.get("USE_FIRESTORE", "").strip().lower() == "true"


@lru_cache(maxsize=1)
def get_client():
    from google.cloud import firestore  # imported lazily so it's never
    return firestore.Client()           # required unless actually enabled