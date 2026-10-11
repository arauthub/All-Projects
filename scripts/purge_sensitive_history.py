#!/usr/bin/env python3
"""
scripts/purge_sensitive_history.py
Completely purges sensitive files or credentials from Git history.
Removes all historical references, rewrites commits, clears reflogs, and runs aggressive garbage collection.
"""

import os
import sys
import re
import argparse
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

SECRET_PATTERNS = [
    ("Private Key", re.compile(r"-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----")),
    ("AWS Access Key ID", re.compile(r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}")),
    ("AWS Secret Key Assignment", re.compile(r"""(?i)aws_secret_access_key\s*=\s*['"][A-Za-z0-9/\+=]{40}['"]""")),
    ("GitHub Personal Access Token", re.compile(r"(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82}")),
    ("Google API Key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("OpenAI API Key", re.compile(r"sk-(?:proj-)?[A-Za-z0-9\-_]{32,}")),
    ("Anthropic API Key", re.compile(r"sk-ant-[A-Za-z0-9\-_]{32,}")),
    ("Slack Token", re.compile(r"xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24,32}")),
    ("Stripe Key", re.compile(r"(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,}")),
    ("Generic High-Entropy Secret", re.compile(r"""(?i)(?:api_key|api_secret|client_secret|db_password)\s*[:=]\s*['"]([A-Za-z0-9\-_+=/.]{16,})['"]""")),
    ("Bearer JWT with Signature", re.compile(r"eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]{20,}")),
]

SAFE_EXCEPTIONS = [
    "example", "replace", "dummy", "placeholder", "your_", "mock",
    "change_me", "change_this", "super_secret", "test-", "test_",
    "default", "todo", "env[", "process.env", "os.getenv", "os.environ"
]

def run_cmd(cmd, check=True):
    res = subprocess.run(cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=check)
    return res.stdout.strip()

def scan_git_history():
    """Audit all objects and commits in Git history for sensitive data."""
    print("🔍 [History Audit] Scanning all historical commits and objects...")
    try:
        objects_out = run_cmd(["git", "rev-list", "--objects", "--all"])
    except subprocess.CalledProcessError as e:
        print(f"Error reading git objects: {e}")
        return []

    blobs = []
    for line in objects_out.splitlines():
        parts = line.split(maxsplit=1)
        if len(parts) == 2:
            blobs.append((parts[0], parts[1]))

    print(f"📦 Analyzing {len(blobs)} unique objects in repository history...")
    violations = []

    for sha, path in blobs:
        # Check filename violations
        base = os.path.basename(path)
        if base.startswith(".env") and not any(base.endswith(s) for s in [".example", ".sample", ".template"]):
            violations.append((sha[:8], path, 1, "Unmasked .env File", path))
            continue
        if any(path.endswith(ext) for ext in [".pem", ".key", ".pkcs12", ".pfx", ".kdbx"]):
            violations.append((sha[:8], path, 1, "Sensitive Key/Certificate File", path))
            continue
        if base in ["id_rsa", "id_ed25519", "id_ecdsa", "credentials.json"]:
            violations.append((sha[:8], path, 1, "Sensitive Identity/Credential File", path))
            continue

        # Skip binary / non-text formats
        if any(path.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".zip", ".tar", ".gz", ".lock", ".min.js"]):
            continue

        # Check content
        try:
            content = run_cmd(["git", "cat-file", "-p", sha], check=False)
            for line_no, line in enumerate(content.splitlines(), start=1):
                for name, pat in SECRET_PATTERNS:
                    match = pat.search(line)
                    if match:
                        snippet = match.group(0)
                        if any(safe in snippet.lower() for safe in SAFE_EXCEPTIONS) or any(safe in line.lower() for safe in SAFE_EXCEPTIONS):
                            continue
                        redacted = snippet[:6] + "..." + snippet[-4:] if len(snippet) > 10 else "***"
                        violations.append((sha[:8], path, line_no, name, redacted))
        except Exception:
            pass

    return violations

def purge_file_from_history(file_pattern):
    """Completely purge a file pattern from all historical commits."""
    print(f"\n🔥 [Purge File] Purging '{file_pattern}' from all Git commits...")

    # Create backup tag before rewrite
    tag_name = f"backup-before-purge-{os.getpid()}"
    run_cmd(["git", "tag", tag_name], check=False)
    print(f"💾 Created safety rollback tag: {tag_name}")

    # Use git filter-branch to remove file from index
    filter_cmd = [
        "git", "filter-branch", "--force",
        "--index-filter", f'git rm --cached --ignore-unmatch "{file_pattern}"',
        "--prune-empty", "--tag-name-filter", "cat", "--", "--all"
    ]
    print(f"⏳ Rewriting commit tree...")
    res = subprocess.run(filter_cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Filter-branch error: {res.stderr}")
        return False

    cleanup_historical_references()
    print(f"✅ Successfully purged '{file_pattern}' from all historical commits.")
    return True

def purge_secret_from_history(secret_literal, replacement="[REDACTED_BY_PRECOMMIT]"):
    """Scrub a literal sensitive string from all files in Git history."""
    print(f"\n🔥 [Purge Secret] Redacting secret string from all Git commits...")

    tag_name = f"backup-before-purge-{os.getpid()}"
    run_cmd(["git", "tag", tag_name], check=False)
    print(f"💾 Created safety rollback tag: {tag_name}")

    # Shell script to replace text in all files during tree-filter
    py_replace = f"""python3 -c "import os, sys
for root, dirs, files in os.walk('.'):
    if '.git' in root: continue
    for f in files:
        p = os.path.join(root, f)
        try:
            with open(p, 'rb') as fp: data = fp.read()
            s = {repr(secret_literal.encode())}
            if s in data:
                with open(p, 'wb') as fp: fp.write(data.replace(s, {repr(replacement.encode())}))
        except Exception: pass
" """

    filter_cmd = [
        "git", "filter-branch", "--force",
        "--tree-filter", py_replace,
        "--prune-empty", "--tag-name-filter", "cat", "--", "--all"
    ]
    print(f"⏳ Rewriting history and replacing secret occurrences...")
    res = subprocess.run(filter_cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Filter-branch error: {res.stderr}")
        return False

    cleanup_historical_references()
    print("✅ Successfully purged sensitive string from all historical references.")
    return True

def cleanup_historical_references():
    """Remove backup refs, expire reflogs, and run aggressive garbage collection."""
    print("🧹 [Clean References] Removing original backup refs, reflogs, and unreachable blobs...")

    # 1. Remove original backup refs created by filter-branch
    backup_refs = run_cmd(["git", "for-each-ref", "--format=%(refname)", "refs/original/"], check=False)
    for ref in backup_refs.splitlines():
        if ref.strip():
            run_cmd(["git", "update-ref", "-d", ref.strip()], check=False)

    # 2. Expire all reflogs immediately
    run_cmd(["git", "reflog", "expire", "--expire=now", "--all"], check=False)

    # 3. Aggressive GC pruning
    run_cmd(["git", "gc", "--prune=now", "--aggressive"], check=False)
    print("✅ Historical references, reflogs, and dangling blobs completely purged.")

def main():
    parser = argparse.ArgumentParser(description="Purge sensitive information from Git history.")
    parser.add_argument("--scan", action="store_true", help="Audit full git history for secrets")
    parser.add_argument("--file", type=str, help="File path or pattern to purge across all commits")
    parser.add_argument("--secret", type=str, help="Secret string to redact across all commits")
    parser.add_argument("--replacement", type=str, default="[REDACTED_BY_PRECOMMIT]", help="Replacement text for redacted secret")
    args = parser.parse_args()

    if args.file:
        if purge_file_from_history(args.file):
            print("\n📌 Notice: To update remote branches, force push using:")
            print("   git push origin --force --all && git push origin --force --tags")
        sys.exit(0)

    if args.secret:
        if purge_secret_from_history(args.secret, args.replacement):
            print("\n📌 Notice: To update remote branches, force push using:")
            print("   git push origin --force --all && git push origin --force --tags")
        sys.exit(0)

    # Default to scanning history
    violations = scan_git_history()
    if violations:
        print(f"\n🚨 [CRITICAL ALERT] Found {len(violations)} historical sensitive references:")
        for sha, path, line_no, name, snip in violations:
            print(f"  ❌ [{sha}] {path}:{line_no} -> {name} ({snip})")
        print("\nTo purge a file from all history, run:")
        print("   python3 scripts/purge_sensitive_history.py --file <path>")
        print("To purge a sensitive token, run:")
        print("   python3 scripts/purge_sensitive_history.py --secret '<token>'")
        sys.exit(1)
    else:
        print("\n🎉 [ALL CLEAR] Zero secrets or sensitive files found in Git history!")
        sys.exit(0)

if __name__ == "__main__":
    main()
