#!/usr/bin/env bash
# deploy/deploy_to_gcp.sh
# 1-Click Turnkey Deployment to Google Cloud Run for Google ADK Multi-Agent Orchestrator.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "================================================================="
echo "🚀 Google Cloud Run Turnkey Deployment: Multi-Agent Orchestrator"
echo "================================================================="

# 1. Check prerequisites
if ! command -v gcloud &> /dev/null; then
  echo "❌ Error: Google Cloud SDK ('gcloud') is not installed or not in PATH."
  echo "👉 Install gcloud: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# 2. Project & Region Configuration
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$CURRENT_PROJECT" ]; then
  read -r -p "Enter your Google Cloud Project ID: " GCP_PROJECT_ID
  gcloud config set project "$GCP_PROJECT_ID"
else
  read -r -p "Target GCP Project ID [$CURRENT_PROJECT]: " INPUT_PROJECT
  GCP_PROJECT_ID="${INPUT_PROJECT:-$CURRENT_PROJECT}"
  gcloud config set project "$GCP_PROJECT_ID"
fi

DEFAULT_REGION="us-central1"
read -r -p "Select GCP Region [$DEFAULT_REGION]: " INPUT_REGION
REGION="${INPUT_REGION:-$DEFAULT_REGION}"

DEFAULT_SERVICE="myagents-orchestrator"
read -r -p "Service Name [$DEFAULT_SERVICE]: " INPUT_SERVICE
SERVICE_NAME="${INPUT_SERVICE:-$DEFAULT_SERVICE}"

echo ""
echo "🔑 Production LLM Configuration:"
echo "   (Leave empty to run in Zero-Key Autonomous Simulation Mode)"
read -r -p "Enter Google Gemini API Key (Optional): " GEMINI_KEY

# 3. Enable Required GCP APIs
echo ""
echo "⚙️ [1/3] Enabling Google Cloud Run and Cloud Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project="$GCP_PROJECT_ID"

# 4. Build Container Image via Cloud Build
IMAGE_TAG="gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}:latest"
echo ""
echo "🐳 [2/3] Building & containerizing image via Google Cloud Build ($IMAGE_TAG)..."
cd "$APP_ROOT"
gcloud builds submit --tag "$IMAGE_TAG" -f deploy/Dockerfile .

# 5. Deploy to Cloud Run
echo ""
echo "🚀 [3/3] Deploying to Google Cloud Run (Managed, Auto-Scaling)..."

ENV_VARS="PORT=8080,PRODUCTION=true"
if [ -n "$GEMINI_KEY" ]; then
  ENV_VARS="${ENV_VARS},GEMINI_API_KEY=${GEMINI_KEY}"
fi

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "$ENV_VARS" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 20

# 6. Retrieve Live Production URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)')

echo ""
echo "================================================================="
echo "🎉 DEPLOYMENT TO GOOGLE CLOUD SUCCESSFUL!"
echo "================================================================="
echo "🌐 Live Production Service URL: $SERVICE_URL"
echo "📊 OpenAPI / Swagger Docs:      $SERVICE_URL/docs"
echo "🤖 Multi-Agent Web UI:          $SERVICE_URL/"
echo "================================================================="
exit 0
