# 🤝 Contributing to All-Projects

Thank you for your interest in contributing to the **All-Projects** monorepo maintained by **Abhijeet Raut** ([@arauthub](https://github.com/arauthub)).

## Monorepo Directory Guidelines

1. **`agents/`**: Autonomous AI agent architectures (Google ADK, LangGraph, Vector Stores).
2. **`apps/`**: Fullstack web applications, CMS platforms, and distributed systems.
3. **`extensions/`**: Chrome Extensions (Manifest V3).
4. **`devops/`**: Multi-container infrastructure and deployment manifests.
5. **`scripts/`**: Automation scripts and presubmit hooks.

## Contribution Workflow

1. Fork or branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your architectural changes.
3. Verify that your code contains no sensitive secrets or credentials.
4. Run the automated Presubmit Suite before committing:
   ```bash
   ./scripts/presubmit.sh
   ```
5. Ensure all project-specific unit tests pass.
6. Submit a Pull Request targeting `main`.
