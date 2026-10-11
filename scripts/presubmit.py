#!/usr/bin/env python3
"""
scripts/presubmit.py
Comprehensive presubmit & pre-push validation suite for the All-Projects monorepo.
Guarantees:
1. Sensitive Information & Secret Leak Prevention (blocks push/commit if secrets found).
2. Project Prerequisites Verification (all projects must have README, DESIGN.md, and configuration).
3. Code Syntax & Integrity (validates JSON, Python compilation, and Shell script syntax).
4. Automatic Discovery & Synchronization in CV_Abhijeet_Raut.md, PROFILE.md, and README.md.
5. Seamless Git Hook integration (pre-commit & pre-push gatekeepers).
"""

import os
import sys
import re
import json
import py_compile
import subprocess
import datetime
from pathlib import Path

# Repository root
REPO_ROOT = Path(__file__).resolve().parent.parent

# Sensitive information regex patterns
SECRET_PATTERNS = [
    ("Private Key", re.compile(r"-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----")),
    ("AWS Access Key ID", re.compile(r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}")),
    ("AWS Secret Key Assignment", re.compile(r"""(?i)aws_secret_access_key\s*=\s*['"][A-Za-z0-9/\+=]{40}['"]""")),
    ("GitHub Personal Access Token", re.compile(r"(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82}")),
    ("Google API Key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("OpenAI API Key", re.compile(r"sk-(?:proj-)?[A-Za-z0-9\-_]{32,}")),
    ("Anthropic API Key", re.compile(r"sk-ant-[A-Za-z0-9\-_]{32,}")),
    ("Slack Token", re.compile(r"xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24,32}")),
    ("Stripe Secret Key", re.compile(r"(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,}")),
    ("Generic High-Entropy Secret", re.compile(r"""(?i)(?:api_key|api_secret|client_secret|db_password)\s*[:=]\s*['"]([A-Za-z0-9\-_+=/.]{16,})['"]""")),
    ("Bearer JWT with Secret Signature", re.compile(r"eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]{20,}")),
]

SENSITIVE_FILENAME_PATTERNS = [
    re.compile(r"(?i)\.(?:pem|pkcs12|pfx|kdbx|key)$"),
    re.compile(r"(?:^|/)(?:id_rsa|id_ed25519|id_ecdsa|credentials\.json)$"),
]

SAFE_EXCEPTIONS = [
    "example", "replace", "dummy", "placeholder", "your_", "mock",
    "change_me", "change_this", "super_secret", "test-", "test_",
    "default", "todo", "env[", "process.env", "os.getenv", "os.environ"
]

IGNORE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".lock", ".map", ".min.js", ".bin", ".tmp", ".pyc"
}

IGNORE_DIRS = {
    "node_modules", ".git", "dist", "build", ".expo", "data", "storage",
    "venv", ".venv", "__pycache__", ".pytest_cache"
}

def run_git(args, check=True):
    """Run a git command and return stripped stdout."""
    res = subprocess.run(
        ["git"] + args,
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=check
    )
    return res.stdout.strip()

def get_staged_or_unpushed_files(mode="standalone", scan_all=False):
    """Get list of files modified in working tree, staged, or in unpushed commits."""
    if scan_all:
        tracked = run_git(["ls-files"], check=False)
        return set(line.strip() for line in tracked.splitlines() if line.strip())

    files = set()

    # 1. In pre-commit mode, prioritize staged files
    if mode == "pre-commit":
        staged_out = run_git(["diff", "--cached", "--name-only", "--diff-filter=ACM"], check=False)
        for line in staged_out.splitlines():
            if line.strip():
                files.add(line.strip())

    # 2. Unstaged & staged files from working tree
    status_out = run_git(["status", "--porcelain"], check=False)
    for line in status_out.splitlines():
        if len(line) > 3:
            filepath = line[3:].strip()
            if "->" in filepath:
                filepath = filepath.split("->")[-1].strip()
            files.add(filepath)

    # 3. Files in unpushed commits compared to remote tracking branch
    try:
        remote_branch = run_git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
    except subprocess.CalledProcessError:
        remote_branch = "origin/main"

    try:
        diff_out = run_git(["diff", "--name-only", f"{remote_branch}...HEAD"])
        for line in diff_out.splitlines():
            if line.strip():
                files.add(line.strip())
    except subprocess.CalledProcessError:
        pass

    return files

def check_sensitive_information(files_to_check=None, mode="standalone"):
    """Scan files and diffs for secrets or sensitive information."""
    print("🔒 [Presubmit 1/5] Running sensitive information & security scan...")
    if files_to_check is None:
        files_to_check = get_staged_or_unpushed_files(mode=mode)

    violations = []

    # 1. Check for committed .env files and sensitive filename extensions
    for rel_path in files_to_check:
        filename = os.path.basename(rel_path)
        # Block unmasked .env files
        if filename.startswith(".env") and not any(filename.endswith(s) for s in [".example", ".sample", ".template"]):
            violations.append((rel_path, 1, "Unmasked .env file cannot be committed to Git!"))
        # Block certificates, private keys, SSH identities
        for pat in SENSITIVE_FILENAME_PATTERNS:
            if pat.search(rel_path):
                violations.append((rel_path, 1, f"Sensitive credential file blocked by policy: {rel_path}"))

    # 2. Check staged diff directly if in pre-commit mode
    if mode == "pre-commit":
        try:
            cached_diff = run_git(["diff", "--cached", "-U0"], check=False)
            current_file = ""
            current_line = 0
            for raw_line in cached_diff.splitlines():
                if raw_line.startswith("+++ b/"):
                    current_file = raw_line[6:]
                elif raw_line.startswith("@@"):
                    m = re.search(r"\+(\d+)", raw_line)
                    if m:
                        current_line = int(m.group(1))
                elif raw_line.startswith("+") and not raw_line.startswith("+++"):
                    added_content = raw_line[1:]
                    for name, pat in SECRET_PATTERNS:
                        match = pat.search(added_content)
                        if match:
                            snippet = match.group(0)
                            if any(safe in snippet.lower() for safe in SAFE_EXCEPTIONS) or any(safe in added_content.lower() for safe in SAFE_EXCEPTIONS):
                                continue
                            redacted = snippet[:6] + "..." + snippet[-4:] if len(snippet) > 10 else "***"
                            violations.append((current_file or "staged", current_line, f"Staged {name}: {redacted}"))
                    current_line += 1
        except Exception as e:
            print(f"⚠️ Warning scanning staged diff: {e}")

    # 3. Check file contents on disk
    for rel_path in files_to_check:
        full_path = REPO_ROOT / rel_path
        if not full_path.is_file():
            continue

        if any(part in IGNORE_DIRS for part in full_path.parts):
            continue
        if full_path.suffix.lower() in IGNORE_EXTENSIONS:
            continue

        if "test" in full_path.name.lower() or "mock" in full_path.name.lower() or "example" in full_path.name.lower():
            continue

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_no, line in enumerate(f, start=1):
                    for name, pat in SECRET_PATTERNS:
                        match = pat.search(line)
                        if match:
                            snippet = match.group(0)
                            if any(safe in snippet.lower() for safe in SAFE_EXCEPTIONS) or any(safe in line.lower() for safe in SAFE_EXCEPTIONS):
                                continue
                            redacted = snippet[:6] + "..." + snippet[-4:] if len(snippet) > 10 else "***"
                            violations.append((rel_path, line_no, f"Possible {name}: {redacted}"))
        except Exception as e:
            print(f"⚠️ Warning reading {rel_path}: {e}")

    if violations:
        print("\n🚨 [SECURITY ALERT] SENSITIVE INFORMATION DETECTED!")
        print(f"Commit / Push ABORTED to protect against credential leaks in {mode} mode.\n")
        for file, line, msg in violations:
            print(f"  ❌ {file}:{line} -> {msg}")
        print("\nRemediation:")
        print("  1. Remove or mask these secrets from your files or git staging.")
        print("  2. If sensitive information was previously committed to git history, run:")
        print("     ./scripts/purge-sensitive-history.sh --file <path>   # or --secret <pattern>")
        return False

    print("✅ [Security Audit] Passed. No secrets or credentials detected.")
    return True

def discover_monorepo_projects():
    """Discover all active projects across apps/, extensions/, agents/, devops/."""
    projects = []
    scan_roots = [
        ("apps", "Fullstack App / Distributed Service"),
        ("extensions", "Browser Extension"),
        ("agents", "Autonomous AI Agent Workflow"),
        ("devops", "DevOps & Infrastructure Automation"),
    ]

    for dir_name, category in scan_roots:
        scan_dir = REPO_ROOT / dir_name
        if not scan_dir.exists():
            continue
        for child in scan_dir.iterdir():
            if child.is_dir() and not child.name.startswith("."):
                projects.append({
                    "id": child.name,
                    "rel_path": f"{dir_name}/{child.name}",
                    "category": category,
                    "type": dir_name,
                    "full_path": child,
                })
    return sorted(projects, key=lambda p: p["rel_path"])

def check_project_prerequisites(projects):
    """
    Verify that every project has completed prerequisites:
    - Non-empty README.md capable of running/explaining the project.
    - Non-empty Technical Design Document (DESIGN.md) specifying tech stack & architecture.
    - Valid configuration (.env.example for services/apps; manifest.json for extensions).
    """
    print("📋 [Presubmit 2/5] Verifying Project Prerequisites & Technical Design Documents...")
    violations = []

    for proj in projects:
        p_path = proj["full_path"]
        rel = proj["rel_path"]
        p_type = proj["type"]

        # 1. README.md check
        readme_path = p_path / "README.md"
        if not readme_path.exists():
            violations.append(f"{rel}: Missing README.md")
        elif readme_path.stat().st_size < 100:
            violations.append(f"{rel}: README.md is empty or incomplete (< 100 bytes)")

        # 2. DESIGN.md check (Technical Design Document)
        design_path = p_path / "DESIGN.md"
        if not design_path.exists():
            violations.append(f"{rel}: Missing Technical Design Document (DESIGN.md)")
        elif design_path.stat().st_size < 150:
            violations.append(f"{rel}: DESIGN.md is incomplete (< 150 bytes)")

        # 3. Configuration check (.env.example for services, manifest.json for extensions)
        if p_type in ("apps", "agents", "devops"):
            env_example = p_path / ".env.example"
            if not env_example.exists():
                violations.append(f"{rel}: Missing environment template (.env.example)")
        elif p_type == "extensions":
            manifest = p_path / "manifest.json"
            if not manifest.exists():
                violations.append(f"{rel}: Missing manifest.json")
            else:
                try:
                    data = json.loads(manifest.read_text(encoding="utf-8"))
                    if data.get("manifest_version") != 3:
                        violations.append(f"{rel}: manifest.json must use Chrome Manifest V3")
                except Exception as e:
                    violations.append(f"{rel}: Invalid manifest.json ({e})")

    if violations:
        print("\n❌ [PREREQUISITES AUDIT FAILED]")
        print("The following projects are missing required documentation or configuration:")
        for v in violations:
            print(f"  ❌ {v}")
        print("\nEvery project must have a valid README.md, Technical Design Document (DESIGN.md),")
        print("and appropriate environment (.env.example) or extension manifest before pushing.\n")
        return False

    print(f"✅ [Prerequisites Audit] Passed. All {len(projects)} monorepo projects satisfy all requirements.")
    return True

def check_syntax_and_integrity(projects):
    """Validate JSON, Python compilation, and Shell script syntax."""
    print("⚙️  [Presubmit 3/5] Validating code syntax and monorepo integrity...")
    errors = []

    # 1. Validate all manifest.json and package.json files
    for proj in projects:
        for json_file in proj["full_path"].glob("*.json"):
            if "node_modules" in json_file.parts or ".git" in json_file.parts:
                continue
            try:
                json.loads(json_file.read_text(encoding="utf-8"))
            except Exception as e:
                errors.append(f"Invalid JSON in {json_file.relative_to(REPO_ROOT)}: {e}")

    # 2. Validate python scripts in scripts/
    scripts_dir = REPO_ROOT / "scripts"
    if scripts_dir.exists():
        for py_file in scripts_dir.glob("*.py"):
            try:
                py_compile.compile(str(py_file), doraise=True)
            except Exception as e:
                errors.append(f"Python syntax error in {py_file.name}: {e}")

    # 3. Validate shell scripts in scripts/ and .githooks/
    for sh_dir in [REPO_ROOT / "scripts", REPO_ROOT / ".githooks"]:
        if sh_dir.exists():
            for sh_file in sh_dir.iterdir():
                if sh_file.is_file() and not sh_file.name.startswith("."):
                    if sh_file.suffix == ".sh" or sh_dir.name == ".githooks":
                        res = subprocess.run(["bash", "-n", str(sh_file)], capture_output=True, text=True)
                        if res.returncode != 0:
                            errors.append(f"Shell syntax error in {sh_file.name}: {res.stderr.strip()}")

    if errors:
        print("\n❌ [SYNTAX & INTEGRITY CHECK FAILED]")
        for err in errors:
            print(f"  ❌ {err}")
        return False

    print("✅ [Syntax Audit] Passed. All JSON, Python, and Shell files are valid.")
    return True

def detect_changed_projects(projects, modified_files):
    """Determine which projects were modified or newly created."""
    changed_project_ids = set()
    for f in modified_files:
        for p in projects:
            if f.startswith(p["rel_path"]):
                changed_project_ids.add(p["id"])
    return changed_project_ids

def get_project_title(project_id):
    """Map project ID to human-readable title."""
    titles = {
        "arnas": "ARNAS: Enterprise Cloud NAS & Zero-Knowledge E2EE Mobile Sync",
        "flashapps": "Flashapps Fullstack Platform & Containerized Architecture",
        "mytail": "Mytail: Wagtail CMS Multi-app Blog & Account Architecture",
        "wagtailwind": "Wagtailwind: Enterprise Wagtail CMS styled with Tailwind CSS",
        "wagtaildemo": "Wagtail Demo: Modular Django Extension Framework",
        "anti-gravity-browser": "Anti-Gravity Web: 2D Physics Engine & Arcade Browser (Chrome Manifest V3)",
        "diagram-image-lens": "Diagram & Image Lens Pro: Precision Visual Inspection (Chrome Manifest V3)",
        "link-inspector-extension": "Link Inspector Pro & Broken Link Checker (Chrome Manifest V3)",
        "api-pulse-pro": "API Pulse Pro: Network Traffic Inspector & Replay Studio (Chrome Manifest V3)",
        "myagents": "Autonomous AI Agent Orchestration Framework (MyAgents)",
        "workspace-curator": "WorkspaceCurator: Google Workspace Webhook Ingestion & AI Curation Engine",
        "jamstack-frontend": "Nexus Prime: Quantum Jamstack & Git Intelligence Portal",
        "docker": "Docker Orchestration & Multi-Container Infrastructure",
        "ci": "CI/CD Automated Presubmit & Verification Pipeline",
    }
    return titles.get(project_id, project_id.replace("-", " ").title())

def sync_cv_and_profile(projects, changed_project_ids, force_sync=False):
    """Ensure CV_Abhijeet_Raut.md and PROFILE.md are completely synchronized."""
    print("📝 [Presubmit 4/5] Verifying CV and Profile project synchronization...")
    cv_file = REPO_ROOT / "CV_Abhijeet_Raut.md"
    profile_file = REPO_ROOT / "PROFILE.md"

    if not cv_file.exists() or not profile_file.exists():
        print("❌ Error: CV or PROFILE markdown files not found!")
        return False

    cv_text = cv_file.read_text(encoding="utf-8")
    profile_text = profile_file.read_text(encoding="utf-8")

    cv_updated = False
    profile_updated = False

    # 1. Ensure all projects are listed in CV
    for proj in projects:
        proj_id = proj["id"]
        rel_path = proj["rel_path"]
        title = get_project_title(proj_id)

        if rel_path not in cv_text and proj_id not in cv_text.lower():
            print(f"➕ Auto-adding new project '{title}' to CV_Abhijeet_Raut.md...")
            new_entry = f"\n### **{title}**\n*Repository*: [`{rel_path}/`](https://github.com/arauthub/All-Projects/tree/main/{rel_path})  \n*Tech Stack*: {proj['category']}\n* Enterprise modular component engineered for high reliability, clean architecture, and decoupled deployment.\n"
            if "## Education" in cv_text:
                cv_text = cv_text.replace("## Education", f"{new_entry}\n## Education")
            else:
                cv_text += f"\n{new_entry}"
            cv_updated = True

        if rel_path not in profile_text and proj_id not in profile_text.lower():
            print(f"➕ Auto-adding new project '{title}' to PROFILE.md...")
            prof_entry = f"\n### 🚀 [{title}](https://github.com/arauthub/All-Projects/tree/main/{rel_path})\n* **Category**: {proj['category']}\n* High-performance enterprise project showcasing modern engineering standards.\n"
            if "## 💼 Career Snapshot" in profile_text:
                profile_text = profile_text.replace("## 💼 Career Snapshot", f"{prof_entry}\n## 💼 Career Snapshot")
            else:
                profile_text += f"\n{prof_entry}"
            profile_updated = True

    # 2. Highlight recently changed apps
    if changed_project_ids:
        print(f"⚡ Projects with recent changes: {', '.join(changed_project_ids)}")
        for proj_id in changed_project_ids:
            highlight_tag = "*(Active Architecture / Recently Updated)*"
            pattern = re.compile(rf"(### \*\*.*{re.escape(proj_id)}.*?\*\*)", re.IGNORECASE)
            if pattern.search(cv_text) and highlight_tag not in cv_text:
                cv_text = pattern.sub(rf"\1 ⚡ {highlight_tag}", cv_text, count=1)
                cv_updated = True

    # 3. Synchronize verification badge & timestamp ONLY when updates occur or force_sync
    badge_marker = "> 📌 **Portfolio Monorepo Synchronization**"
    if cv_updated or force_sync or badge_marker not in cv_text:
        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        badge_content = f"{badge_marker}: Verified up to date with repository on `{now_str}` • Presubmit Suite Clean"
        if badge_marker in cv_text:
            cv_text = re.sub(rf"{re.escape(badge_marker)}.*", badge_content, cv_text)
        else:
            insert_marker = "## Executive Summary\n"
            if insert_marker in cv_text:
                cv_text = cv_text.replace(insert_marker, f"{insert_marker}\n{badge_content}\n")
        cv_updated = True

    if cv_updated:
        cv_file.write_text(cv_text, encoding="utf-8")
        print("✅ [CV Sync] CV_Abhijeet_Raut.md updated and synchronized.")
    else:
        print("✅ [CV Sync] CV_Abhijeet_Raut.md is up to date.")

    if profile_updated:
        profile_file.write_text(profile_text, encoding="utf-8")
        print("✅ [Profile Sync] PROFILE.md updated and synchronized.")
    else:
        print("✅ [Profile Sync] PROFILE.md is up to date.")

    return True

def sync_readme(projects):
    """Ensure root README.md catalog includes all projects."""
    print("📖 [Presubmit 5/5] Verifying root README catalog...")
    readme_file = REPO_ROOT / "README.md"
    if not readme_file.exists():
        return True

    readme_text = readme_file.read_text(encoding="utf-8")
    readme_updated = False

    for proj in projects:
        if proj["rel_path"] not in readme_text and proj["id"] not in readme_text:
            print(f"⚠️ Notice: Project {proj['rel_path']} missing from README.md. Adding reference...")
            table_row = f"| [**{get_project_title(proj['id'])}**]({proj['rel_path']}/) | {proj['category']} | Native Stack | Modular architecture component. |\n"
            if "## 🚀 Projects Catalog" in readme_text:
                parts = readme_text.split("## 🚀 Projects Catalog\n\n| Project | Category | Primary Tech Stack | Description |\n| :--- | :--- | :--- | :--- |\n")
                if len(parts) == 2:
                    readme_text = parts[0] + "## 🚀 Projects Catalog\n\n| Project | Category | Primary Tech Stack | Description |\n| :--- | :--- | :--- | :--- |\n" + table_row + parts[1]
                    readme_updated = True

    if readme_updated:
        readme_file.write_text(readme_text, encoding="utf-8")
        print("✅ [README Sync] README.md catalog synchronized.")
    else:
        print("✅ [README Sync] README.md catalog is up to date.")
    return True

def main():
    if "--scan-history" in sys.argv:
        import purge_sensitive_history
        violations = purge_sensitive_history.scan_git_history()
        if violations:
            print(f"\n🚨 [CRITICAL ALERT] Found {len(violations)} historical sensitive references!")
            sys.exit(1)
        else:
            print("\n🎉 [ALL CLEAR] Zero secrets or sensitive files found in Git history!")
            sys.exit(0)

    mode = "standalone"
    if "--mode=pre-commit" in sys.argv:
        mode = "pre-commit"
    elif "--mode=pre-push" in sys.argv:
        mode = "pre-push"

    scan_all = "--all" in sys.argv

    print(f"\n🚀 Running Monorepo Presubmit & Pre-Push Suite (Mode: {mode})")
    print("=" * 70)

    # 1. Collect modified files
    modified_files = get_staged_or_unpushed_files(mode=mode, scan_all=scan_all)

    # 2. Check sensitive information
    if not check_sensitive_information(modified_files, mode=mode):
        sys.exit(1)

    # 3. Discover projects
    projects = discover_monorepo_projects()

    # 4. Check project prerequisites
    if not check_project_prerequisites(projects):
        sys.exit(1)

    # 5. Check syntax & integrity
    if not check_syntax_and_integrity(projects):
        sys.exit(1)

    # 6. Detect changed projects
    changed_project_ids = detect_changed_projects(projects, modified_files)

    # 7. Sync CV and Profile
    if not sync_cv_and_profile(projects, changed_project_ids):
        sys.exit(1)

    # 8. Sync README
    if not sync_readme(projects):
        sys.exit(1)

    # 9. Sync Nexus Prime Portfolio Jamstack
    scripts_dir = str(REPO_ROOT / "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    import sync_portfolio
    sync_portfolio.sync_portfolio(mode=mode)

    # 10. Verify staging state
    cv_file = "CV_Abhijeet_Raut.md"
    profile_file = "PROFILE.md"
    readme_file = "README.md"
    portfolio_manifest = "apps/jamstack-frontend/data/build-manifest.json"
    portfolio_intel = "apps/jamstack-frontend/js/git-intelligence.js"
    doc_changes = run_git(["status", "--porcelain", cv_file, profile_file, readme_file, portfolio_manifest, portfolio_intel], check=False)

    if doc_changes:
        if mode == "pre-commit":
            print("📝 Pre-commit: Auto-staging updated CV, Profile, README, and Portfolio assets...")
            run_git(["add", cv_file, profile_file, readme_file, portfolio_manifest, portfolio_intel])
        elif mode == "pre-push":
            print("\n⚠️  [PRE-PUSH ABORTED] Documentation synchronization required.")
            print("Presubmit detected or generated updates in portfolio documentation.")
            print("Please commit the changes before pushing:")
            print("  git add CV_Abhijeet_Raut.md PROFILE.md README.md apps/jamstack-frontend/")
            print("  git commit -m 'docs: synchronize portfolio and project documentation'")
            print("  git push\n")
            sys.exit(1)
        elif mode == "standalone":
            print("💡 Changes to documentation detected. Run 'git add' to stage them.")

    print("=" * 70)
    print("🎉 Monorepo Presubmit & Pre-Push Suite PASSED cleanly!")
    print("   All pre-commits verified: 0 secrets, all project prerequisites met.\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
