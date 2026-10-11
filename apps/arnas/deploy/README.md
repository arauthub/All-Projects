# ARNAS Enterprise Cloud Deployment Runbook (GCP & AWS)

This guide documents the 1-go automated production deployment procedures for ARNAS across **Google Cloud Platform (GCP)** and **Amazon Web Services (AWS)**.

---

## 🚀 Quick Start (1-Click CLI Execution)

From the `apps/arnas` root directory:

### Deploy to Google Cloud Platform (GCP)
```bash
# Dry-run validation (no cloud changes)
./deploy.sh --target gcp --dry-run

# Live Production Deployment
./deploy.sh --target gcp --project <your-gcp-project-id> --region us-central1
```

### Deploy to Amazon Web Services (AWS)
```bash
# Dry-run validation
./deploy.sh --target aws --dry-run

# Live Production Deployment
./deploy.sh --target aws --region us-east-1
```

---

## 🏛️ Architecture Overviews

### Google Cloud Platform Architecture
- **Compute Tier**: Cloud Run (Managed Knative containers, automated scale-from-zero, TLS termination)
- **Database**: Cloud SQL PostgreSQL 16 (Automated point-in-time recovery, private VPC connector)
- **Object Storage**: Google Cloud Storage (GCS) Multi-Region bucket acting as asynchronous cluster replica node
- **Image Registry**: Artifact Registry (`us-central1-docker.pkg.dev`)
- **Build Pipeline**: Google Cloud Build with Docker multi-stage caching

### Amazon Web Services Architecture
- **Compute Tier**: AWS ECS Fargate (Serverless container orchestration, Application Load Balancer)
- **Database**: Amazon RDS PostgreSQL 16 (Multi-AZ synchronous replication)
- **Object Storage**: Amazon S3 (AES-256 SSE, lifecycle expiration, immutable vaults)
- **Image Registry**: Amazon Elastic Container Registry (ECR)
- **Secrets & Audit**: AWS Systems Manager Parameter Store + CloudWatch Container Insights

---

## 🔐 Enterprise Security & Zero-Trust
1. **Zero Secrets in Code**: Environment secrets are passed at runtime via Cloud Secret Manager or AWS Parameter Store.
2. **Tenant Data Isolation**: Database schemas enforce foreign-key user constraints. Accessing unshared files returns `403 Forbidden`.
3. **End-to-End Encryption (E2EE)**: Sensitive media is encrypted client-side using AES-256-GCM. Cloud databases only hold ciphertext chunks.
4. **Pre-Flight Validation**: Run `./scripts/presubmit.sh` prior to every release to audit for credential leaks and update CV metadata.
