# Iva — Cloud Run Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- [ ] GCP project created at https://console.cloud.google.com
- [ ] Billing enabled on the project
- [ ] `gcloud` CLI installed and authenticated (`gcloud auth login`)
- [ ] Required APIs enabled (see below)
- [ ] `GEMINI_API_KEY` from https://aistudio.google.com
- [ ] Firestore database created (Native mode)
- [ ] Service account JSON downloaded

## Step 0 — Enable Required GCP APIs

```bash
export PROJECT_ID=your-gcp-project-id
gcloud config set project $PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com
```

## Step 1 — Store Secrets in Secret Manager

```bash
# Gemini API Key
echo -n "your-gemini-api-key" | \
  gcloud secrets create iva-gemini-key --data-file=-

# GCP Project ID
echo -n "$PROJECT_ID" | \
  gcloud secrets create iva-gcp-project --data-file=-
```

## Step 2 — Create Firestore Database

```bash
gcloud firestore databases create \
  --location=asia-south1 \
  --type=firestore-native
```

## Step 3 — Create Service Account for Cloud Run

```bash
gcloud iam service-accounts create iva-run-sa \
  --display-name="Iva Cloud Run Service Account"

# Grant Firestore access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:iva-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:iva-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant Pub/Sub access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:iva-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

## Step 4 — Build & Deploy (Manual)

```bash
cd Iva_codes

# Build image
docker build -t gcr.io/$PROJECT_ID/iva-agent-core:latest -f backend/Dockerfile backend/

# Push to GCR
docker push gcr.io/$PROJECT_ID/iva-agent-core:latest

# Deploy to Cloud Run
gcloud run deploy iva-agent-core \
  --image=gcr.io/$PROJECT_ID/iva-agent-core:latest \
  --region=asia-south1 \
  --platform=managed \
  --allow-unauthenticated \
  --service-account=iva-run-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --set-secrets="GEMINI_API_KEY=iva-gemini-key:latest,GOOGLE_CLOUD_PROJECT=iva-gcp-project:latest" \
  --set-env-vars="ENVIRONMENT=production,FIRESTORE_DATABASE_ID=(default)" \
  --min-instances=0 \
  --max-instances=3 \
  --memory=1Gi \
  --cpu=1
```

## Step 5 — Cloud Build (CI/CD, optional)

```bash
# Connect your GitHub repo to Cloud Build in the GCP console first, then:
gcloud builds submit --config=backend/cloudbuild.yaml .
```

## Step 6 — Verify Deployment

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe iva-agent-core \
  --region=asia-south1 --format='value(status.url)')

# Health check
curl $SERVICE_URL/health

# Test chat endpoint
curl -X POST $SERVICE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo_user","message":"Which scholarships can I get as a female student in Maharashtra?"}'
```

## Step 7 — Pub/Sub Topic for Person 4

```bash
gcloud pubsub topics create iva-status-check

# Grant Person 4's service account subscription rights
gcloud pubsub topics add-iam-policy-binding iva-status-check \
  --member="serviceAccount:iva-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

## Cost Control Notes

- **scale-to-zero**: `--min-instances=0` means no cost when idle.
- **gemini-2.0-flash** is the most cost-efficient Gemini model for hackathon use.
- Use `--max-instances=3` to cap concurrent scaling.
- For dev/testing, run locally with mock mode (no API keys = no Gemini charges).

## Environment Variables Reference

| Variable | Where set in Cloud Run | Value |
|---|---|---|
| `GEMINI_API_KEY` | Secret Manager → `--set-secrets` | From AI Studio |
| `GOOGLE_CLOUD_PROJECT` | Secret Manager → `--set-secrets` | GCP project ID |
| `ENVIRONMENT` | `--set-env-vars` | `production` |
| `FIRESTORE_DATABASE_ID` | `--set-env-vars` | `(default)` |
| `PUBSUB_TOPIC` | `--set-env-vars` | `iva-status-check` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Not needed in Cloud Run | Cloud Run uses workload identity |

> **Note**: In Cloud Run, `GOOGLE_APPLICATION_CREDENTIALS` is not needed.
> The service account attached to the Cloud Run service (`--service-account`) provides credentials automatically.
> Only needed locally (point to your downloaded JSON key file).
