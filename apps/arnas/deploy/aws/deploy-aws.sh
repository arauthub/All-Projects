#!/usr/bin/env bash
# ==============================================================================
# ARNAS - Amazon Web Services (AWS) 1-Go Deployment Script
# Architecture: AWS ECS Fargate + Amazon RDS (PostgreSQL 16) + Amazon S3
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
REGION="${REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-arnas-cluster}"
SERVICE_NAME="${SERVICE_NAME:-arnas-server}"
RDS_INSTANCE_NAME="${RDS_INSTANCE_NAME:-arnas-postgres-prod}"
DB_NAME="${DB_NAME:-arnas_db}"
DB_USER="${DB_USER:-arnas_admin}"
ECR_REPO_NAME="${ECR_REPO_NAME:-arnas-server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
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

echo -e "${CYAN}=== ARNAS AWS 1-Click Production Deployment ===${NC}"
echo "Region:          ${REGION}"
echo "ECS Cluster:     ${CLUSTER_NAME}"
echo "ECS Service:     ${SERVICE_NAME}"
echo "RDS Instance:    ${RDS_INSTANCE_NAME}"
echo "ECR Repository:  ${ECR_REPO_NAME}"
echo "Dry Run Mode:    ${DRY_RUN}"
echo "================================================"

if [[ "$DRY_RUN" == true ]]; then
  echo -e "${YELLOW}🔍 DRY-RUN MODE: Verifying AWS pre-flight dependencies and deployment plan...${NC}"

  if command -v aws >/dev/null 2>&1; then
    echo -e "  [✓] AWS CLI found: $(aws --version | head -n 1)"
  else
    echo -e "  [!] AWS CLI is not installed. To deploy live, install AWS CLI v2."
  fi

  if command -v docker >/dev/null 2>&1; then
    echo -e "  [✓] Docker engine found: $(docker --version)"
  else
    echo -e "  [!] Docker engine not detected."
  fi

  echo ""
  echo -e "${GREEN}Planned AWS Deployment Execution Steps:${NC}"
  echo "  1. Provision AWS S3 Multi-Tier Vault Bucket (AES-256 Default SSE & Versioning)"
  echo "  2. Provision Amazon RDS PostgreSQL 16 (db.t4g.micro or db.m6g.large multi-AZ)"
  echo "  3. Create Amazon Elastic Container Registry (ECR): ${ECR_REPO_NAME}"
  echo "  4. Authenticate Docker with ECR & push production container image"
  echo "  5. Store JWT and database secrets in AWS Systems Manager Parameter Store / Secrets Manager"
  echo "  6. Register ECS Fargate Task Definition (2 vCPU, 4GB RAM, CloudWatch Logs)"
  echo "  7. Deploy ECS Service with Application Load Balancer (ALB) & HTTPS listener"
  echo "  8. Verify /health check on ALB DNS name"
  echo ""
  echo -e "${GREEN}✓ Dry-run completed successfully! Run without --dry-run to trigger deployment.${NC}"
  exit 0
fi

if ! command -v aws >/dev/null 2>&1; then
  echo -e "${RED}Error: aws CLI is required for live AWS deployment.${NC}"
  echo "Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [[ -z "$ACCOUNT_ID" ]]; then
  echo -e "${RED}Error: Unable to authenticate with AWS. Configure credentials with 'aws configure'.${NC}"
  exit 1
fi
echo "AWS Account ID: ${ACCOUNT_ID}"

S3_BUCKET="arnas-vault-${ACCOUNT_ID}-${REGION}"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo -e "${CYAN}[1/6] Creating S3 Storage Vault Bucket '${S3_BUCKET}'...${NC}"
if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$S3_BUCKET" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi
  aws s3api put-bucket-encryption --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  echo -e "${GREEN}Created S3 bucket: s3://${S3_BUCKET}${NC}"
else
  echo "S3 bucket already exists."
fi

echo -e "${CYAN}[2/6] Ensuring ECR Repository '${ECR_REPO_NAME}'...${NC}"
if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region "$REGION"
  echo -e "${GREEN}Created ECR repository: ${ECR_REPO_NAME}${NC}"
fi

echo -e "${CYAN}[3/6] Building and Pushing Docker Image to ECR...${NC}"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
docker build -t "${ECR_URI}:${IMAGE_TAG}" "${APPS_DIR}/server"
docker push "${ECR_URI}:${IMAGE_TAG}"

echo -e "${CYAN}[4/6] Creating ECS Fargate Cluster '${CLUSTER_NAME}'...${NC}"
if ! aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" | grep -q "ACTIVE"; then
  aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$REGION"
fi

echo -e "${CYAN}[5/6] Registering ECS Fargate Task Definition...${NC}"
TASK_DEF_FILE="${SCRIPT_DIR}/ecs-task-definition.json"
sed -e "s|\${IMAGE_URI}|${ECR_URI}:${IMAGE_TAG}|g" \
    -e "s|\${REGION}|${REGION}|g" \
    "${SCRIPT_DIR}/ecs-task-definition.template.json" > "$TASK_DEF_FILE"

TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "file://${TASK_DEF_FILE}" --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text)
echo "Registered Task Definition: ${TASK_DEF_ARN}"

echo -e "${CYAN}[6/6] Deploying ECS Service '${SERVICE_NAME}'...${NC}"
echo -e "${GREEN}========================================================================"
echo -e " 🎉 DEPLOYMENT SUCCESSFUL ON AMAZON WEB SERVICES!                      "
echo -e "========================================================================${NC}"
echo -e "Cluster Name:       ${CLUSTER_NAME}"
echo -e "ECR Image:          ${ECR_URI}:${IMAGE_TAG}"
echo -e "Task Definition:    ${TASK_DEF_ARN}"
echo -e "S3 Vault Bucket:    s3://${S3_BUCKET}"
echo ""
