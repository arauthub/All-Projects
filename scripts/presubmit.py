#!/usr/bin/env python3
"""
scripts/presubmit.py
Comprehensive presubmit suite for the All-Projects monorepo.
Guarantees:
1. Sensitive Information & Secret Leak Prevention (blocks push/commit if secrets found).
2. Automatic Discovery of all projects in apps/, extensions/, agents/.
3. Automatic Detection of newly created or modified apps/projects.
4. Automatic Synchronization & Highlighting of projects in CV_Abhijeet_Raut.md and PROFILE.md.
5. README project catalog verification.
6. Seamless git hook integration (pre-commit & pre-push).
"""

import os
import sys
import re
import subprocess
import datetime
from pathlib import Path

# Repository root
REPO_ROOT = Path(__file__).resolve().parent.parent

# Sensitive information regex patterns
SECRET_PATTERNS = [
    ("Private Key", re.compile(r"-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----")),
    ("AWS Access Key ID", re.compile(r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}")),
    ("AWS Secret Key Assignment", re.compile(r"(?i)aws_secret_access_key\s*=\s*['\"][A-Za-z0-9/\+=]{40}['\"]")),
    ("GitHub Personal Access Token", re.compile(r"(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82}")),
    ("Google API Key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("Slack Token", re.compile(r"xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24,32}")),
    ("Bearer JWT with Secret Signature", re.compile(r"eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]{20,}")),
]

# File patterns to exclude from secret scans
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

def get_staged_or_unpushed_files():
    """Get list of files modified in working tree, staged, or in unpushed commits."""
    files = set()

    # 1. Unstaged & staged files
    status_out = run_git(["status", "--porcelain"], check=False)
    for line in status_out.splitlines():
        if len(line) > 3:
            filepath = line[3:].strip()
            # Handle renames e.g. "R  old -> new"
            if "->" in filepath:
                filepath = filepath.split("->")[-1].strip()
            files.add(filepath)

    # 2. Files in unpushed commits compared to origin/main
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

def check_sensitive_information(files_to_check=None):
    """Scan files for secrets or sensitive information."""
    print("🔒 [Presubmit 1/4] Running sensitive information & security scan...")
    if files_to_check is None:
        files_to_check = get_staged_or_unpushed_files()

    violations = []

    # Check for committed .env files
    for rel_path in files_to_check:
        filename = os.path.basename(rel_path)
        if filename.startswith(".env") and not filename.endswith(".example"):
            violations.append((rel_path, 1, "Unmasked .env file cannot be committed to Git!"))

    for rel_path in files_to_check:
        full_path = REPO_ROOT / rel_path
        if not full_path.is_file():
            continue

        # Skip ignored directories and binary extensions
        if any(part in IGNORE_DIRS for part in full_path.parts):
            continue
        if full_path.suffix.lower() in IGNORE_EXTENSIONS:
            continue

        # Skip unit test files with mock credentials
        if "test" in full_path.name.lower() or "mock" in full_path.name.lower() or "example" in full_path.name.lower():
            continue

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_no, line in enumerate(f, start=1):
                    # Check regexes
                    for name, pat in SECRET_PATTERNS:
                        match = pat.search(line)
                        if match:
                            snippet = match.group(0)
                            # Allow safe documentation placeholders
                            if any(safe in snippet.lower() for safe in ["example", "replace", "dummy", "placeholder", "your_"]):
                                continue
                            redacted = snippet[:6] + "..." + snippet[-4:] if len(snippet) > 10 else "***"
                            violations.append((rel_path, line_no, f"Possible {name}: {redacted}"))
        except Exception as e:
            print(f"⚠️ Warning reading {rel_path}: {e}")

    if violations:
        print("\n🚨 [SECURITY ALERT] SENSITIVE INFORMATION DETECTED!")
        print("Push aborted to protect against credential leaks.\n")
        for file, line, msg in violations:
            print(f"  ❌ {file}:{line} -> {msg}")
        print("\nPlease remove or mask these secrets before pushing.")
        return False

    print("✅ [Security Audit] Passed. No secrets or credentials detected.")
    return True

def discover_monorepo_projects():
    """Discover all active projects in apps/, extensions/, agents/."""
    projects = []
    scan_roots = [
        ("apps", "Fullstack App / Distributed Service"),
        ("extensions", "Browser Extension"),
        ("agents", "Autonomous AI Agent Workflow"),
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
                    "full_path": child,
                })
    return projects

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
        "myagents": "Autonomous AI Agent Orchestration Framework (MyAgents)",
    }
    return titles.get(project_id, project_id.replace("-", " ").title())

def sync_cv_and_profile(projects, changed_project_ids):
    """Ensure CV_Abhijeet_Raut.md and PROFILE.md are completely synchronized."""
    print("📝 [Presubmit 2/4] Verifying CV and Profile project synchronization...")
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

        # Check if project exists in CV
        if rel_path not in cv_text and proj_id not in cv_text.lower():
            print(f"➕ Auto-adding new project '{title}' to CV_Abhijeet_Raut.md...")
            # Append new project entry
            new_entry = f"\n### **{title}**\n*Repository*: [`{rel_path}/`](https://github.com/arauthub/All-Projects/tree/main/{rel_path})  \n*Tech Stack*: {proj['category']}\n* Enterprise modular component engineered for high reliability, clean architecture, and decoupled deployment.\n"
            # Insert before Education section
            if "## Education" in cv_text:
                cv_text = cv_text.replace("## Education", f"{new_entry}\n## Education")
            else:
                cv_text += f"\n{new_entry}"
            cv_updated = True

        # Check if project exists in PROFILE.md
        if rel_path not in profile_text and proj_id not in profile_text.lower():
            print(f"➕ Auto-adding new project '{title}' to PROFILE.md...")
            prof_entry = f"\n### 🚀 [{title}](https://github.com/arauthub/All-Projects/tree/main/{rel_path})\n* **Category**: {proj['category']}\n* High-performance enterprise project showcasing modern engineering standards.\n"
            if "## 💼 Career Snapshot" in profile_text:
                profile_text = profile_text.replace("## 💼 Career Snapshot", f"{prof_entry}\n## 💼 Career Snapshot")
            else:
                profile_text += f"\n{prof_entry}"
            profile_updated = True

    # 2. Highlight recently changed or updated apps
    if changed_project_ids:
        print(f"⚡ Projects with recent changes: {', '.join(changed_project_ids)}")
        for proj_id in changed_project_ids:
            title = get_project_title(proj_id)
            # Add or update highlight in CV if not already present
            highlight_tag = "*(Active Architecture / Recently Updated)*"
            pattern = re.compile(rf"(### \*\*.*{re.escape(proj_id)}.*?\*\*)", re.IGNORECASE)
            if pattern.search(cv_text) and highlight_tag not in cv_text:
                # Add highlight tag to the first line of the matching project
                cv_text = pattern.sub(rf"\1 ⚡ {highlight_tag}", cv_text, count=1)
                cv_updated = True

    # 3. Synchronize verification badge & timestamp
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    badge_marker = "> 📌 **Portfolio Monorepo Synchronization**"
    badge_content = f"{badge_marker}: Verified up to date with repository on `{now_str}` • Presubmit Suite Clean"

    if badge_marker in cv_text:
        cv_text = re.sub(rf"{re.escape(badge_marker)}.*", badge_content, cv_text)
        cv_updated = True
    else:
        # Insert after Executive Summary
        insert_marker = "## Executive Summary\n"
        if insert_marker in cv_text:
            cv_text = cv_text.replace(insert_marker, f"{insert_marker}\n{badge_content}\n")
            cv_updated = True

    if cv_updated:
        cv_file.write_text(cv_text, encoding="utf-8")
        print("✅ [CV Sync] CV_Abhijeet_Raut.md updated and synchronized.")

    if profile_updated:
        profile_file.write_text(profile_text, encoding="utf-8")
        print("✅ [Profile Sync] PROFILE.md updated and synchronized.")

    return True

def sync_readme(projects):
    """Ensure root README.md catalog includes all projects."""
    print("📖 [Presubmit 3/4] Verifying root README catalog...")
    readme_file = REPO_ROOT / "README.md"
    if not readme_file.exists():
        return True

    readme_text = readme_file.read_text(encoding="utf-8")
    readme_updated = False

    for proj in projects:
        if proj["rel_path"] not in readme_text and proj["id"] not in readme_text:
            print(f"⚠️ Notice: Project {proj['rel_path']} missing from README.md. Adding reference...")
            # Automatically add to Projects Catalog table
            table_row = f"| [**{get_project_title(proj['id'])}**]({proj['rel_path']}/) | {proj['category']} | Native Stack | Modular architecture component. |\n"
            if "## 🚀 Projects Catalog" in readme_text:
                # Find end of table
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
    mode = "standalone"
    if "--mode=pre-commit" in sys.argv:
        mode = "pre-commit"
    elif "--mode=pre-push" in sys.argv:
        mode = "pre-push"

    print(f"\n🚀 Running Monorepo Presubmit Suite (Mode: {mode})")
    print("=" * 60)

    # 1. Collect modified files
    modified_files = get_staged_or_unpushed_files()

    # 2. Check sensitive information
    if not check_sensitive_information(modified_files):
        sys.exit(1)

    # 3. Discover projects
    projects = discover_monorepo_projects()
    changed_project_ids = detect_changed_projects(projects, modified_files)

    # 4. Sync CV and Profile
    if not sync_cv_and_profile(projects, changed_project_ids):
        sys.exit(1)

    # 5. Sync README
    if not sync_readme(projects):
        sys.exit(1)

    print("🔍 [Presubmit 4/4] Verifying Git staging state...")
    cv_file = "CV_Abhijeet_Raut.md"
    profile_file = "PROFILE.md"
    readme_file = "README.md"

    # Check if doc files have changes
    doc_changes = run_git(["status", "--porcelain", cv_file, profile_file, readme_file], check=False)

    if doc_changes:
        print("📝 Staging updated CV, Profile, and documentation...")
        run_git(["add", cv_file, profile_file, readme_file])

        if mode == "pre-push":
            print("🚀 Committing updated CV before push...")
            run_git(["commit", "-m", "docs: auto-sync CV and profile on push [skip ci]"])
            branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
            print(f"🚀 Pushing new commit with updated CV to origin/{branch}...")
            # Push with --no-verify to prevent infinite recursion
            subprocess.run(["git", "push", "--no-verify", "origin", f"HEAD:{branch}"], cwd=REPO_ROOT, check=True)
            run_git(["fetch", "origin", branch], check=False)
            print("✅ Successfully pushed new commit with updated CV to remote.")
        elif mode == "standalone":
            print("💡 Tip: Changes have been staged with 'git add'.")

    print("=" * 60)
    print("🎉 Monorepo Presubmit Suite PASSED cleanly!\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
