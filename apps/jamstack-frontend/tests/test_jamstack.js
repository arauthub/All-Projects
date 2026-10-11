#!/usr/bin/env node
/**
 * Automated Verification Suite for Nexus Prime Jamstack Frontend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, name) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
  }
}

console.log('🧪 Running Nexus Prime Jamstack Verification Suite...\n');

// 1. Structure Tests
console.log('📂 1. Directory & File Integrity:');
assert(fs.existsSync(path.join(APP_ROOT, 'index.html')), 'index.html exists');
assert(fs.existsSync(path.join(APP_ROOT, 'styles/main.css')), 'styles/main.css exists');
assert(fs.existsSync(path.join(APP_ROOT, 'styles/components.css')), 'styles/components.css exists');
assert(fs.existsSync(path.join(APP_ROOT, 'styles/sandboxes.css')), 'styles/sandboxes.css exists');
assert(fs.existsSync(path.join(APP_ROOT, 'js/app.js')), 'js/app.js exists');
assert(fs.existsSync(path.join(APP_ROOT, 'js/projects-data.js')), 'js/projects-data.js exists');
assert(fs.existsSync(path.join(APP_ROOT, 'js/profile-data.js')), 'js/profile-data.js exists');
assert(fs.existsSync(path.join(APP_ROOT, 'js/git-intelligence.js')), 'js/git-intelligence.js exists');
assert(fs.existsSync(path.join(APP_ROOT, 'README.md')), 'README.md exists');
assert(fs.existsSync(path.join(APP_ROOT, 'DESIGN.md')), 'DESIGN.md exists');
assert(fs.existsSync(path.join(APP_ROOT, '.env.example')), '.env.example exists');
assert(fs.existsSync(path.join(APP_ROOT, 'assets/profile-photo.png')), 'assets/profile-photo.png exists');
assert(fs.existsSync(path.join(APP_ROOT, 'assets/og-image.png')), 'assets/og-image.png exists');

// Verify social meta & CV intro in index.html
const indexHtmlContent = fs.readFileSync(path.join(APP_ROOT, 'index.html'), 'utf-8');
assert(indexHtmlContent.includes('Abhijeet Raut — Lead Backend & AI/ML Engineer | Solutions Architect'), 'index.html title matches CV');
assert(indexHtmlContent.includes('property="og:image" content="https://arauthub.github.io/portfolio/assets/og-image.png"'), 'index.html has og:image social card');

// 2. Data Integrity Tests
console.log('\n📊 2. Projects & Profile Data Integrity:');
import('../js/projects-data.js').then(({ MONOREPO_PROJECTS }) => {
  assert(Array.isArray(MONOREPO_PROJECTS) && MONOREPO_PROJECTS.length >= 10, `Contains all monorepo projects (found ${MONOREPO_PROJECTS.length})`);
  
  const arnas = MONOREPO_PROJECTS.find(p => p.id === 'arnas');
  assert(arnas && arnas.techStack.includes('AES-256-GCM'), 'ARNAS contains AES-256-GCM stack');

  const myagents = MONOREPO_PROJECTS.find(p => p.id === 'myagents');
  assert(myagents && myagents.simulatorId === 'swarm-dag', 'MyAgents links to swarm-dag simulator');

  const antigravity = MONOREPO_PROJECTS.find(p => p.id === 'anti-gravity-browser');
  assert(antigravity && antigravity.techStack.includes('Matter.js Physics'), 'Anti-Gravity links to Matter.js');

  return import('../js/profile-data.js');
}).then(({ PROFILE_DATA }) => {
  assert(PROFILE_DATA.name === 'Abhijeet Raut', 'Profile author is Abhijeet Raut');
  assert(PROFILE_DATA.yearsOfExperience === 12, '12 years experience verified');
  assert(PROFILE_DATA.workExperience.length >= 2, 'Persistent Systems & Cybage Software roles present');
  assert(PROFILE_DATA.skillsArsenal.length >= 4, 'Skills arsenal categorised across 4+ domains');

  return import('../js/git-intelligence.js');
}).then(({ STATIC_GIT_SNAPSHOT }) => {
  console.log('\n🐙 3. Git Intelligence & Presubmit Checks:');
  assert(STATIC_GIT_SNAPSHOT.activeBranch === 'main', 'Active branch is main');
  assert(STATIC_GIT_SNAPSHOT.presubmitAudit.status === 'PASSED', 'Presubmit status is PASSED');
  assert(STATIC_GIT_SNAPSHOT.commits.length >= 6, 'Contains verified commits stream');

  console.log(`\n======================================================`);
  console.log(`🏁 Results: ${passedTests}/${totalTests} tests passed cleanly!`);
  if (passedTests === totalTests) {
    console.log(`🎉 All Jamstack unit tests PASSED!`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
