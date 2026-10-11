#!/usr/bin/env bash
# ==============================================================================
# ARNAS - Enterprise Cloud 1-Go Deployment Master Script
# Autonomous Private Cloud & Storage Cluster
# Supports: Google Cloud Platform (GCP) & Amazon Web Services (AWS)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET=""
DRY_RUN=false
PROJECT_ID=""
REGION=""

# Color definitions
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_banner() {
  echo -e "${CYAN}"
  echo "========================================================================"
  echo "      ARNAS ENTERPRISE CLOUD 1-CLICK DEPLOYMENT ENGINE                  "
  echo "      Autonomous Private NAS & Multi-Node Cluster Orchestrator          "
  echo "========================================================================"
  echo -e "${NC}"
}

usage() {
  echo "Usage: $0 --target <gcp|aws> [OPTIONS]"
  echo ""
  echo "Targets:"
  echo "  --target gcp       Deploy to Google Cloud Platform (Cloud Run + Cloud SQL + GCS)"
  echo "  --target aws       Deploy to Amazon Web Services (ECS Fargate + RDS + S3)"
  echo ""
  echo "Options:"
  echo "  --project <id>     GCP Project ID (default: current gcloud active project)"
  echo "  --region <region>  Cloud Region (default: us-central1 for GCP, us-east-1 for AWS)"
  echo "  --dry-run          Validate pre-flight environment and print plans without deploying"
  echo "  --help, -h         Show this help message"
  echo ""
  exit 1
}

# Parse command line flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
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
    --help|-h)
      usage
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      usage
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo -e "${RED}Error: --target <gcp|aws> is required.${NC}"
  usage
fi

print_banner

if [[ "$TARGET" == "gcp" ]]; then
  echo -e "${GREEN}Targeting Google Cloud Platform (Cloud Run, Cloud SQL PostgreSQL, Cloud Storage)${NC}"
  GCP_SCRIPT="${SCRIPT_DIR}/deploy/gcp/deploy-gcp.sh"
  chmod +x "$GCP_SCRIPT"
  
  CMD=("$GCP_SCRIPT")
  [[ -n "$PROJECT_ID" ]] && CMD+=(--project "$PROJECT_ID")
  [[ -n "$REGION" ]] && CMD+=(--region "$REGION")
  [[ "$DRY_RUN" == true ]] && CMD+=(--dry-run)

  "${CMD[@]}"

elif [[ "$TARGET" == "aws" ]]; then
  echo -e "${GREEN}Targeting Amazon Web Services (ECS Fargate, RDS PostgreSQL, Amazon S3)${NC}"
  AWS_SCRIPT="${SCRIPT_DIR}/deploy/aws/deploy-aws.sh"
  chmod +x "$AWS_SCRIPT"

  CMD=("$AWS_SCRIPT")
  [[ -n "$REGION" ]] && CMD+=(--region "$REGION")
  [[ "$DRY_RUN" == true ]] && CMD+=(--dry-run)

  "${CMD[@]}"

else
  echo -e "${RED}Error: Invalid target '$TARGET'. Must be either 'gcp' or 'aws'.${NC}"
  exit 1
fi
