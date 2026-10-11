/**
 * Nexus Prime - Cyber Quantum Terminal
 * Interactive in-browser developer CLI
 */

import { soundSynth } from './audio-synth.js';
import { MONOREPO_PROJECTS } from './projects-data.js';
import { PROFILE_DATA } from './profile-data.js';
import { STATIC_GIT_SNAPSHOT } from './git-intelligence.js';

export class CyberTerminal {
  constructor(containerId, inputId, outputId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById(inputId);
    this.output = document.getElementById(outputId);
    this.history = [];
    this.historyIndex = -1;
    this.isMatrixActive = false;

    if (this.input) {
      this.bindEvents();
    }
  }

  bindEvents() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = this.input.value.trim();
        if (cmd) {
          this.history.push(cmd);
          this.historyIndex = this.history.length;
          this.execute(cmd);
          this.input.value = '';
        }
      } else if (e.key === 'ArrowUp') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.historyIndex] || '';
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex] || '';
        } else {
          this.historyIndex = this.history.length;
          this.input.value = '';
        }
        e.preventDefault();
      }
    });
  }

  execute(commandStr) {
    soundSynth.playTerminalBeep();
    const [cmd, ...args] = commandStr.toLowerCase().split(/\s+/);

    this.appendLine(`<span class="term-prompt">nexus@quantum:~$</span> ${this.escapeHtml(commandStr)}`, 'cmd');

    switch (cmd) {
      case 'help':
        this.appendLine(`
<span class="text-cyan">Available Quantum Terminal Commands:</span>
  <span class="text-emerald">projects</span>     List all 11 monorepo projects & architectures
  <span class="text-emerald">profile</span>      View Abhijeet Raut's 12-year Lead Architect profile
  <span class="text-emerald">skills</span>       Display technical competencies & arsenal
  <span class="text-emerald">git log</span>      View recent verified commits in All-Projects
  <span class="text-emerald">git status</span>   Check active branch and working tree state
  <span class="text-emerald">presubmit</span>    Run the 5-stage automated presubmit verification
  <span class="text-emerald">matrix</span>       Toggle cyberpunk digital rain background
  <span class="text-emerald">audio</span> [on|off] Toggle Web Audio cyber synthesizer
  <span class="text-emerald">contact</span>      Display contact coordinates & GitHub links
  <span class="text-emerald">clear</span>        Clear terminal screen
        `);
        break;

      case 'projects':
        let projText = `<span class="text-cyan">Active Monorepo Architectures (${MONOREPO_PROJECTS.length}):</span>\n`;
        MONOREPO_PROJECTS.forEach((p, idx) => {
          projText += `  [${idx + 1}] <strong class="text-white">${p.title}</strong>\n      Stack: ${p.techStack.join(', ')}\n      Path: ${p.relPath}\n`;
        });
        this.appendLine(projText);
        break;

      case 'profile':
        this.appendLine(`
<strong class="text-cyan">${PROFILE_DATA.name}</strong> — ${PROFILE_DATA.headline}
Location: ${PROFILE_DATA.location} • Experience: ${PROFILE_DATA.yearsOfExperience} Years
GitHub: <a href="${PROFILE_DATA.github}" target="_blank" class="term-link">${PROFILE_DATA.githubUsername}</a> • Email: ${PROFILE_DATA.email}

${PROFILE_DATA.summary}
        `);
        break;

      case 'skills':
        let skillsText = `<span class="text-cyan">Technical Arsenal & Competencies:</span>\n`;
        PROFILE_DATA.skillsArsenal.forEach(cat => {
          skillsText += `\n<strong class="text-emerald">${cat.icon} ${cat.category}:</strong>\n`;
          cat.skills.forEach(s => {
            skillsText += `  • ${s.name} [${s.level}%]\n`;
          });
        });
        this.appendLine(skillsText);
        break;

      case 'git':
        const sub = args[0];
        if (sub === 'log') {
          let logText = `<span class="text-cyan">Recent Commits on branch '${STATIC_GIT_SNAPSHOT.activeBranch}':</span>\n`;
          STATIC_GIT_SNAPSHOT.commits.slice(0, 6).forEach(c => {
            logText += `  <strong class="text-amber">${c.hash}</strong> - ${c.message} <span class="text-dim">(${c.relativeDate} by ${c.authorTag})</span>\n`;
          });
          this.appendLine(logText);
        } else if (sub === 'status') {
          this.appendLine(`
<span class="text-cyan">Repository State:</span>
On branch <strong class="text-emerald">${STATIC_GIT_SNAPSHOT.activeBranch}</strong>
HEAD commit: <strong class="text-amber">${STATIC_GIT_SNAPSHOT.headCommit}</strong>
Presubmit status: <strong class="text-emerald">5/5 CHECKS CLEAN (0 Secrets)</strong>
Working tree: Ready for deployment.
          `);
        } else {
          this.appendLine(`Unknown git subcommand. Try: git log or git status`);
        }
        break;

      case 'presubmit':
        this.appendLine(`
<span class="text-cyan">Executing Virtual Presubmit Suite (scripts/presubmit.py)...</span>
[1/5] Sensitive Information & Secret Scan: <strong class="text-emerald">PASSED (0 leaks)</strong>
[2/5] Project Prerequisites (README, DESIGN.md): <strong class="text-emerald">PASSED (13/13 verified)</strong>
[3/5] Code Syntax & JSON Integrity: <strong class="text-emerald">PASSED (All valid)</strong>
[4/5] CV & Profile Synchronization: <strong class="text-emerald">PASSED (Synchronized)</strong>
[5/5] Root README Catalog Alignment: <strong class="text-emerald">PASSED (Clean)</strong>
<strong class="text-emerald">RESULT: Presubmit Verified 100% Clean!</strong>
        `);
        soundSynth.playExecute();
        break;

      case 'matrix':
        this.toggleMatrix();
        break;

      case 'audio':
        const mode = args[0];
        if (mode === 'on') {
          if (!soundSynth.isEnabled) soundSynth.toggle();
          this.appendLine(`Web Audio Synthesizer: <strong class="text-emerald">ENABLED</strong>`);
        } else if (mode === 'off') {
          if (soundSynth.isEnabled) soundSynth.toggle();
          this.appendLine(`Web Audio Synthesizer: <strong class="text-amber">MUTED</strong>`);
        } else {
          const state = soundSynth.toggle();
          this.appendLine(`Web Audio Synthesizer toggled: <strong class="${state ? 'text-emerald' : 'text-amber'}">${state ? 'ENABLED' : 'MUTED'}</strong>`);
        }
        break;

      case 'contact':
        this.appendLine(`
<span class="text-cyan">Direct Engineering Contact:</span>
Email: <a href="mailto:${PROFILE_DATA.email}" class="term-link">${PROFILE_DATA.email}</a>
GitHub: <a href="${PROFILE_DATA.github}" target="_blank" class="term-link">${PROFILE_DATA.github}</a>
Portfolio Monorepo: <a href="${PROFILE_DATA.portfolioRepo}" target="_blank" class="term-link">${PROFILE_DATA.portfolioRepo}</a>
        `);
        break;

      case 'clear':
        this.output.innerHTML = '';
        return;

      default:
        this.appendLine(`Command not recognized: "${this.escapeHtml(cmd)}". Type <strong class="text-cyan">help</strong> for available commands.`, 'error');
    }

    this.scrollToBottom();
  }

  appendLine(html, type = 'output') {
    const div = document.createElement('div');
    div.className = `term-line term-${type}`;
    div.innerHTML = html;
    this.output.appendChild(div);
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  toggleMatrix() {
    this.isMatrixActive = !this.isMatrixActive;
    let canvas = document.getElementById('matrix-rain-canvas');
    if (this.isMatrixActive) {
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain-canvas';
        canvas.className = 'matrix-canvas';
        document.body.appendChild(canvas);
      }
      this.runMatrixRain(canvas);
      this.appendLine(`Cyber Matrix Rain: <strong class="text-emerald">ACTIVE</strong>`);
      soundSynth.playWarp();
    } else {
      if (canvas) canvas.remove();
      this.appendLine(`Cyber Matrix Rain: <strong class="text-amber">DEACTIVATED</strong>`);
    }
  }

  runMatrixRain(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01ABCDEFΩΨ01011001NEXUSQUANTUM101010';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      if (!this.isMatrixActive) return;
      ctx.fillStyle = 'rgba(6, 8, 16, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00f5ff';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      requestAnimationFrame(draw);
    };

    draw();
  }
}
