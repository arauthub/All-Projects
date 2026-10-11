/**
 * Nexus Prime - Command Palette (Spotlight Search)
 * Instantaneous fuzzy search across projects, skills, and tools
 */

import { soundSynth } from './audio-synth.js';
import { MONOREPO_PROJECTS } from './projects-data.js';
import { PROFILE_DATA } from './profile-data.js';
import { HolodeckSandboxes } from './holodeck-sandboxes.js';

export class CommandPalette {
  constructor() {
    this.modal = document.getElementById('command-palette-modal');
    this.input = document.getElementById('palette-input');
    this.results = document.getElementById('palette-results');
    this.items = [];
    this.selectedIndex = 0;

    this.buildIndex();
    this.bindEvents();
  }

  buildIndex() {
    this.items = [];

    // Projects
    MONOREPO_PROJECTS.forEach(p => {
      this.items.push({
        type: 'Project',
        title: p.title,
        subtitle: `${p.categoryLabel} • ${p.techStack.join(', ')}`,
        icon: '⚡',
        action: () => {
          const el = document.getElementById(`project-${p.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      if (p.simulatorId) {
        this.items.push({
          type: 'Simulator',
          title: `Launch ${p.simulatorName}`,
          subtitle: `Interactive Holodeck Sandbox for ${p.title}`,
          icon: '🚀',
          action: () => HolodeckSandboxes.open(p.simulatorId)
        });
      }
    });

    // Skills
    PROFILE_DATA.skillsArsenal.forEach(cat => {
      cat.skills.forEach(s => {
        this.items.push({
          type: 'Skill',
          title: s.name,
          subtitle: `${cat.category} [${s.level}% proficiency]`,
          icon: '🛠️',
          action: () => {
            const el = document.getElementById('skills-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });
    });

    // Quick Actions
    this.items.push({
      type: 'Action',
      title: 'Run Monorepo Presubmit Security Audit',
      subtitle: 'Simulate 5/5 presubmit verification checks',
      icon: '🛡️',
      action: () => HolodeckSandboxes.open('presubmit-runner')
    });

    this.items.push({
      type: 'Action',
      title: 'Open Cyber Quantum Terminal',
      subtitle: 'In-browser CLI with matrix rain & git log',
      icon: '💻',
      action: () => {
        const term = document.getElementById('terminal-section');
        if (term) term.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('term-input')?.focus();
      }
    });

    this.items.push({
      type: 'Link',
      title: 'View GitHub Monorepo (arauthub/portfolio)',
      subtitle: 'Open repository in a new tab',
      icon: '🐙',
      action: () => window.open(PROFILE_DATA.portfolioRepo, '_blank')
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    this.input?.addEventListener('input', () => {
      soundSynth.playHover();
      this.search(this.input.value);
    });

    this.input?.addEventListener('keydown', (e) => {
      const items = this.results?.querySelectorAll('.palette-item') || [];
      if (e.key === 'ArrowDown') {
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateSelection(items);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection(items);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (items[this.selectedIndex]) {
          items[this.selectedIndex].click();
        }
      }
    });

    document.getElementById('btn-open-palette')?.addEventListener('click', () => {
      this.open();
    });

    this.modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      this.close();
    });
  }

  isOpen() {
    return this.modal?.classList.contains('active');
  }

  toggle() {
    if (this.isOpen()) this.close();
    else this.open();
  }

  open() {
    if (!this.modal) return;
    soundSynth.playWarp();
    this.modal.classList.add('active');
    document.body.classList.add('modal-open');
    this.input.value = '';
    this.search('');
    this.input.focus();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    soundSynth.playClick();
  }

  search(query) {
    const q = query.toLowerCase().trim();
    const filtered = q
      ? this.items.filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        )
      : this.items.slice(0, 8);

    this.selectedIndex = 0;
    this.renderResults(filtered);
  }

  renderResults(list) {
    if (!this.results) return;
    if (list.length === 0) {
      this.results.innerHTML = `<div class="palette-empty">No results found in quantum index.</div>`;
      return;
    }

    this.results.innerHTML = '';
    list.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = `palette-item ${index === this.selectedIndex ? 'selected' : ''}`;
      div.innerHTML = `
        <span class="palette-icon">${item.icon}</span>
        <div class="palette-info">
          <span class="palette-title">${item.title}</span>
          <span class="palette-sub">${item.subtitle}</span>
        </div>
        <span class="palette-type">${item.type}</span>
      `;
      div.addEventListener('click', () => {
        soundSynth.playExecute();
        this.close();
        item.action();
      });
      this.results.appendChild(div);
    });
  }

  updateSelection(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === this.selectedIndex);
      if (idx === this.selectedIndex) item.scrollIntoView({ block: 'nearest' });
    });
  }
}
