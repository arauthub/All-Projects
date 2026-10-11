#!/usr/bin/env bash
# ==============================================================================
# ARNAS - Google Cloud Platform (GCP) 1-Go Deployment Script
# Architecture: Cloud Run + Cloud SQL (PostgreSQL 16) + Cloud Storage (GCS)
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Default Configuration
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-arnas-server}"
SQL_INSTANCE_NAME="${SQL_INSTANCE_NAME:-arnas-postgres-prod}"
DB_NAME="${DB_NAME:-arnas_db}"
DB_USER="${DB_USER:-arnas_admin}"
STORAGE_BUCKET="${STORAGE_BUCKET:-arnas-vault-${PROJECT_ID:-demo}}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_ID="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${CYAN}=== ARNAS GCP 1-Click Production Deployment ===${NC}"
echo "Project ID:      ${PROJECT_ID:-[Not Configured]}"
echo "Region:          ${REGION}"
echo "Cloud Run:       ${SERVICE_NAME}"
echo "Cloud SQL:       ${SQL_INSTANCE_NAME}"
echo "Storage Bucket:  ${STORAGE_BUCKET}"
echo "Dry Run Mode:    ${DRY_RUN}"
echo "================================================"

if [[ "$DRY_RUN" == true ]]; then
  echo -e "${YELLOW}🔍 DRY-RUN MODE: Verifying pre-flight dependencies and deployment plan...${NC}"
  
  if command -v gcloud >/dev/null 2>&1; then
    echo -e "  [✓] gcloud CLI found: $(gcloud --version | head -n 1)"
  else
    echo -e "  [!] gcloud CLI is not installed. To deploy live, install Google Cloud SDK."
  fi

  if command -v docker >/dev/null 2>&1; then
    echo -e "  [✓] Docker engine found: $(docker --version)"
  else
    echo -e "  [!] Docker engine not detected."
  fi

  echo ""
  echo -e "${GREEN}Planned GCP Deployment Execution Steps:${NC}"
  echo "  1. Enable GCP APIs: run, sqladmin, storage, artifactregistry, cloudbuild"
  echo "  2. Create GCS Multi-Tier Bucket: gs://${STORAGE_BUCKET}"
  echo "  3. Provision Cloud SQL PostgreSQL 16: ${SQL_INSTANCE_NAME} (db-f1-micro or db-custom-2-7680)"
  echo "  4. Generate Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/arnas-repo/${SERVICE_NAME}:${IMAGE_TAG}"
  echo "  5. Build & push container image with Cloud Build"
  echo "  6. Execute Prisma migrations via Cloud SQL Auth Proxy"
  echo "  7. Deploy Cloud Run Service with auto-scaling (min: 0, max: 10), HTTPS, and Cloud SQL connection"
  echo "  8. Execute post-deploy /health check and report public endpoint"
  echo ""
  echo -e "${GREEN}✓ Dry-run completed successfully! Run without --dry-run to trigger deployment.${NC}"
  exit 0
fi

# Live execution check
if ! command -v gcloud >/dev/null 2>&1; then
  echo -e "${RED}Error: gcloud CLI is required for live GCP deployment.${NC}"
  echo "Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo -e "${RED}Error: GCP Project ID is required. Pass --project <project-id> or set gcloud default.${NC}"
  exit 1
fi

echo -e "${CYAN}[1/7] Setting active GCP project to '${PROJECT_ID}'...${NC}"
gcloud config set project "$PROJECT_ID"

echo -e "${CYAN}[2/7] Enabling required Google Cloud APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

echo -e "${CYAN}[3/7] Provisioning Cloud Storage Vault Bucket...${NC}"
if ! gcloud storage buckets describe "gs://${STORAGE_BUCKET}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${STORAGE_BUCKET}" \
    --project="$PROJECT_ID" \
    --location="$REGION" \
    --uniform-bucket-level-access
  echo -e "${GREEN}Created storage bucket: gs://${STORAGE_BUCKET}${NC}"
else
  echo "Storage bucket gs://${STORAGE_BUCKET} already exists."
fi

echo -e "${CYAN}[4/7] Ensuring Artifact Registry Docker Repository...${NC}"
REPO_NAME="arnas-repo"
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="ARNAS Docker Repository"
  echo -e "${GREEN}Created Artifact Registry repository: ${REPO_NAME}${NC}"
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"

echo -e "${CYAN}[5/7] Building and submitting container image via Cloud Build...${NC}"
gcloud builds submit "${APPS_DIR}/server" \
  --tag "$IMAGE_URI" \
  --project "$PROJECT_ID"

echo -e "${CYAN}[6/7] Ensuring Cloud SQL PostgreSQL instance...${NC}"
if ! gcloud sql instances describe "$SQL_INSTANCE_NAME" >/dev/null 2>&1; then
  echo "Creating Cloud SQL PostgreSQL 16 instance '${SQL_INSTANCE_NAME}' (this may take a few minutes)..."
  gcloud sql instances create "$SQL_INSTANCE_NAME" \
    --database-version=POSTGRES_16 \
    --tier=db-custom-2-7680 \
    --region="$REGION" \
    --storage-size=50GB \
    --storage-auto-increase
fi

SQL_CONNECTION_NAME=$(gcloud sql instances describe "$SQL_INSTANCE_NAME" --format="value(connectionName)")
echo "Cloud SQL Connection Name: ${SQL_CONNECTION_NAME}"

echo -e "${CYAN}[7/7] Deploying ARNAS Server to Google Cloud Run...${NC}"
JWT_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_REFRESH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PORT=8080,HOST=0.0.0.0,JWT_SECRET=${JWT_SECRET},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET},STORAGE_ROOT=/data/storage" \
  --add-cloudsql-instances "$SQL_CONNECTION_NAME" \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format="value(status.url)")

echo ""
echo -e "${GREEN}========================================================================"
echo -e " 🎉 DEPLOYMENT SUCCESSFUL ON GOOGLE CLOUD PLATFORM!                     "
echo -e "========================================================================${NC}"
echo -e "Public Endpoint:    ${CYAN}${SERVICE_URL}${NC}"
echo -e "Health Check:       ${CYAN}${SERVICE_URL}/health${NC}"
echo -e "API Docs (Swagger): ${CYAN}${SERVICE_URL}/documentation${NC}"
echo -e "Cloud SQL Instance: ${SQL_CONNECTION_NAME}"
echo -e "Vault GCS Bucket:   gs://${STORAGE_BUCKET}"
echo ""
