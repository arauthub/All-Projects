/**
 * Nexus Prime - Git Intelligence & Repository Stream
 * Integrates live GitHub REST API with pre-rendered Jamstack static fallback
 */

export const STATIC_GIT_SNAPSHOT = {
  repo: {
    owner: "arauthub",
    name: "All-Projects",
    full_name: "arauthub/All-Projects",
    html_url: "https://github.com/arauthub/All-Projects",
    description: "Curated enterprise monorepo: Autonomous AI multi-agent swarms, distributed cloud storage NAS, Chrome Manifest V3 extensions, Wagtail/Django platforms, and DevOps automation.",
    default_branch: "main",
    stars: 48,
    forks: 12,
    open_issues: 0,
    license: "MIT",
    language: "Python / TypeScript / Go",
    pushed_at: "2026-10-11T13:20:05Z"
  },
  activeBranch: "main",
  headCommit: "392b93d",
  presubmitAudit: {
    status: "PASSED",
    score: "5 / 5 Checks Green",
    checks: [
      { name: "Sensitive Information & Secret Leak Scanner", status: "CLEAN", details: "0 secrets detected across working tree & staged diff" },
      { name: "Project Prerequisites & Documentation Audit", status: "VERIFIED", details: "All 13 monorepo projects have valid README, DESIGN.md & configs" },
      { name: "Code Syntax & Monorepo Integrity", status: "VALID", details: "JSON schemas, Python compilation & Shell syntax 100% valid" },
      { name: "CV & Profile Bi-Directional Synchronization", status: "SYNCED", details: "Synchronized with CV_Abhijeet_Raut.md & PROFILE.md" },
      { name: "Root README Project Catalog Verification", status: "ALIGNED", details: "Master catalog in sync with all architectural domains" }
    ]
  },
  commits: [
    {
      hash: "a9756b6",
      fullHash: "a9756b668a4f3667726f81945f661b1585591f46",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 18:50:05 +0530",
      relativeDate: "Active Just Now",
      message: "chore(hooks): enforce all pre-commit validations before pushing to remote",
      type: "chore",
      badge: "Pre-Push Gatekeeper",
      branch: "main",
      stats: { additions: 42, deletions: 8, filesChanged: 4 }
    },
    {
      hash: "d529795",
      fullHash: "d529795d0740a78061e495a42362fa2b739ff1b5",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 18:44:36 +0530",
      relativeDate: "Today",
      message: "docs: auto-sync CV and profile on push [skip ci]",
      type: "docs",
      badge: "Auto-Sync",
      branch: "main",
      stats: { additions: 18, deletions: 4, filesChanged: 2 }
    },
    {
      hash: "559e971",
      fullHash: "559e971a4e37c0de7559a5eb820445b9888e496c",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 18:43:27 +0530",
      relativeDate: "Today",
      message: "docs: auto-sync CV and profile on push [skip ci]",
      type: "docs",
      badge: "Profile Sync",
      branch: "main",
      stats: { additions: 12, deletions: 2, filesChanged: 2 }
    },
    {
      hash: "891fd58",
      fullHash: "891fd5893c973da19be9f2fe192a0dc516f4d44d",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 18:40:08 +0530",
      relativeDate: "Today",
      message: "docs: auto-sync CV and profile on push [skip ci]",
      type: "docs",
      badge: "Docs Sync",
      branch: "main",
      stats: { additions: 8, deletions: 1, filesChanged: 1 }
    },
    {
      hash: "fedbcb6",
      fullHash: "fedbcb6eb5725b58018fa54c3d75a7cc18455692",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 18:38:05 +0530",
      relativeDate: "Today",
      message: "feat(security): add pre-commit sensitive information blocker, full history scanner, and historical purge utility",
      type: "feat",
      badge: "Security Core",
      branch: "main",
      stats: { additions: 540, deletions: 22, filesChanged: 6 }
    },
    {
      hash: "85e166d",
      fullHash: "85e166d9fc7376fc80c10d2c4a391bfab276693d",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 14:43:13 +0530",
      relativeDate: "Today",
      message: "docs: add technical design documents, complete execution runbooks, and prerequisites across all projects",
      type: "docs",
      badge: "Architecture Docs",
      branch: "main",
      stats: { additions: 920, deletions: 45, filesChanged: 14 }
    },
    {
      hash: "e8ec119",
      fullHash: "e8ec11978761d03a35ad3d0da559860070f301b3",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-11 13:45:06 +0530",
      relativeDate: "Today",
      message: "feat(arnas): implement enterprise RBAC, user content isolation, role-based site guide, and 1-click cloud deployment for GCP and AWS",
      type: "feat",
      badge: "ARNAS Cloud NAS",
      branch: "main",
      stats: { additions: 780, deletions: 60, filesChanged: 11 }
    },
    {
      hash: "7c438ee",
      fullHash: "7c438ee32355ec47adb347d5ec5f57d70d8c8490",
      author: "Abhijeet Raut",
      authorTag: "@arauthub",
      date: "2026-10-10 21:20:12 +0530",
      relativeDate: "Yesterday",
      message: "feat(arnas): add external HDD/SSD NAS support for wireless mobile-to-drive storage",
      type: "feat",
      badge: "External NAS",
      branch: "main",
      stats: { additions: 340, deletions: 12, filesChanged: 5 }
    }
  ]
};

/**
 * Fetch dynamic data from GitHub API if connected, with automatic fallback
 */
export async function getGitIntelligenceData() {
  const cached = { ...STATIC_GIT_SNAPSHOT, source: "Jamstack Static Edge Cache" };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const repoRes = await fetch("https://api.github.com/repos/arauthub/All-Projects", {
      signal: controller.signal,
      headers: { "Accept": "application/vnd.github.v3+json" }
    });
    clearTimeout(timeoutId);

    if (repoRes.ok) {
      const repoData = await repoRes.json();
      return {
        ...cached,
        source: "Live GitHub REST API",
        isLive: true,
        repo: {
          ...cached.repo,
          stars: repoData.stargazers_count ?? cached.repo.stars,
          forks: repoData.forks_count ?? cached.repo.forks,
          open_issues: repoData.open_issues_count ?? cached.repo.open_issues,
          pushed_at: repoData.pushed_at ?? cached.repo.pushed_at
        }
      };
    }
  } catch {
    // Network unavailable or rate limited: smooth fallback
  }

  return { ...cached, isLive: false };
}
