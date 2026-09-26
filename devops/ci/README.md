# 🛠️ Monorepo Continuous Integration (CI) Pipeline

> Multi-stage automated validation pipeline configured for **GitHub Actions**, validating security, Presubmit sync, Python multi-agent swarms, and Fastify server test suites.

## 📋 CI Jobs Specification

The pipeline defined in [`ci.yml`](ci.yml) executes:

1. **Job 1: Security Audit & Monorepo Synchronization (`presubmit-audit`)**:
   - Executes `./scripts/presubmit.sh --ci`.
   - Performs regex-based credential leak audits.
   - Validates that `CV_Abhijeet_Raut.md`, `PROFILE.md`, and `README.md` match all active projects.
2. **Job 2: Google ADK Multi-Agent Swarm Testing (`myagents-test-suite`)**:
   - Python 3.11 environment.
   - Installs dependencies from `agents/myagents/requirements.txt`.
   - Executes automated unit tests for in-memory vector store, tool calling registry, and orchestrator execution graph.
3. **Job 3: ARNAS Fastify & E2EE Testing (`arnas-server-test-suite`)**:
   - Node.js 20 environment.
   - Generates Prisma client and runs database migrations.
   - Executes Vitest test suite for auth, file streaming, E2EE key vaults, and multi-storage nodes.

---

## 🚀 Activation in GitHub Actions

To enable this workflow directly in GitHub Actions on your repository (`arauthub/All-Projects`):

1. Ensure your GitHub Personal Access Token has the **`workflow`** scope enabled:
   - Navigate to: **GitHub Settings** ➔ **Developer settings** ➔ **Personal access tokens** ➔ **Tokens (classic)**
   - Check the **`workflow`** checkbox ("Update GitHub Action workflows").
2. Copy the workflow file to `.github/workflows/`:
   ```bash
   mkdir -p .github/workflows
   cp devops/ci/ci.yml .github/workflows/ci.yml
   git add .github/workflows/ci.yml
   git commit -m "ci: enable github actions workflow"
   git push origin main
   ```
3. Alternatively, create `.github/workflows/ci.yml` directly in the GitHub web interface at `https://github.com/arauthub/All-Projects/actions/new`.

---

## 👤 Author

**Abhijeet Raut**
- GitHub: [@arauthub](https://github.com/arauthub)
- Email: theabhijeetraut@gmail.com
- Monorepo: [arauthub/All-Projects](https://github.com/arauthub/All-Projects)
