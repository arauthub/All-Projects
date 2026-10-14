/**
 * Nexus Prime - Main Application Controller & Jamstack Hydration Engine
 * Architected for Abhijeet Raut (Lead Backend, AI/ML Architect)
 */

import { MONOREPO_PROJECTS } from './projects-data.js';
import { PROFILE_DATA } from './profile-data.js';
import { getGitIntelligenceData, STATIC_GIT_SNAPSHOT } from './git-intelligence.js';
import { QuantumCanvas } from './quantum-canvas.js';
import { soundSynth } from './audio-synth.js';
import { HolodeckSandboxes } from './holodeck-sandboxes.js';
import { CyberTerminal } from './terminal-cli.js';
import { CommandPalette } from './command-palette.js';
import { renderMonorepoExplorer } from './monorepo-tree.js';

class NexusPrimeApp {
  constructor() {
    this.projects = MONOREPO_PROJECTS;
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.gitData = STATIC_GIT_SNAPSHOT;
  }

  async init() {
    // 0. Ensure viewport lands directly at the top hero headshot
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (window.location.hash && window.location.hash !== '#hero-section') {
      history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // 1. Instant Static Jamstack Hydration (0ms First Meaningful Paint)
    this.gitData = STATIC_GIT_SNAPSHOT;

    // 2. Render Page Sections Immediately (Zero network delay)
    this.renderHeaderHUD();
    this.renderHeroSection();
    this.renderGitStream();
    this.renderProjectFilters();
    this.renderProjectsGrid();
    this.renderCareerTimeline();
    this.renderSkillsArsenal();
    renderMonorepoExplorer('monorepo-explorer-container');

    // 3. Initialize Interactive Controls, Navigation & Mobile Drawer
    this.initMobileDrawer();
    this.initScrollSpy();
    this.commandPalette = new CommandPalette();
    this.terminal = new CyberTerminal('terminal-section', 'term-input', 'term-output');

    // 4. Initialize Living Particle Canvas (Smooth & Lightweight)
    new QuantumCanvas('quantum-canvas');

    // 5. Asynchronous Background Live Telemetry Fetch (Non-blocking)
    getGitIntelligenceData().then(liveData => {
      if (liveData && liveData.isLive) {
        this.gitData = liveData;
        this.updateLiveGitTelemetry();
      }
    }).catch(() => {});

    // 6. Bind Global Events, Audio & Keyboard Shortcuts
    this.bindGlobalEvents();
    this.startLiveTelemetryClock();

    console.log('%c🌌 NEXUS PRIME QUANTUM JAMSTACK INITIALIZED (INSTANT 0MS)', 'color: #00f5ff; font-weight: bold; font-size: 14px;');
  }

  // 1. Header HUD & Navigation
  renderHeaderHUD() {
    const branchEl = document.getElementById('hud-branch');
    const commitEl = document.getElementById('hud-commit');
    const mobileBranchEl = document.getElementById('mobile-hud-branch');
    const mobileCommitEl = document.getElementById('mobile-hud-commit');
    const audioBtn = document.getElementById('btn-audio-toggle');
    const audioBars = document.getElementById('hud-audio-bars');

    if (branchEl) branchEl.textContent = this.gitData.activeBranch;
    if (commitEl) commitEl.textContent = this.gitData.headCommit;
    if (mobileBranchEl) mobileBranchEl.textContent = this.gitData.activeBranch;
    if (mobileCommitEl) mobileCommitEl.textContent = this.gitData.headCommit;

    // Synchronized Audio UI updater
    const updateAudioUI = () => {
      const isEnabled = soundSynth.isEnabled;
      if (audioBtn) {
        audioBtn.classList.toggle('active', isEnabled);
        audioBtn.querySelector('.audio-label').textContent = isEnabled ? 'AUDIO ON' : 'AUDIO OFF';
      }
      if (audioBars) {
        audioBars.classList.toggle('animating', isEnabled);
      }
      const mobBtn = document.getElementById('btn-mobile-audio');
      const mobBars = document.getElementById('mobile-audio-bars');
      if (mobBtn) {
        mobBtn.classList.toggle('active', isEnabled);
        mobBtn.querySelector('.audio-label').textContent = isEnabled ? 'AUDIO ON' : 'AUDIO OFF';
      }
      if (mobBars) {
        mobBars.classList.toggle('animating', isEnabled);
      }
    };

    updateAudioUI();

    audioBtn?.addEventListener('click', () => {
      soundSynth.toggle();
      updateAudioUI();
    });
  }

  // Mobile Cyber Navigation Drawer Controller
  initMobileDrawer() {
    const hamburgerBtn = document.getElementById('btn-hamburger-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const closeBtn = document.getElementById('btn-mobile-drawer-close');
    const navItems = document.querySelectorAll('.mobile-nav-item');
    const mobileAudioBtn = document.getElementById('btn-mobile-audio');
    const mobileAudioBars = document.getElementById('mobile-audio-bars');
    const mobileCvBtn = document.getElementById('btn-mobile-open-cv');
    const mobilePresubmitChip = document.getElementById('mobile-presubmit-chip');

    const openDrawer = () => {
      hamburgerBtn?.classList.add('active');
      hamburgerBtn?.setAttribute('aria-expanded', 'true');
      drawer?.classList.add('active');
      drawer?.setAttribute('aria-hidden', 'false');
      backdrop?.classList.add('active');
      soundSynth.playClick();
    };

    const closeDrawer = () => {
      hamburgerBtn?.classList.remove('active');
      hamburgerBtn?.setAttribute('aria-expanded', 'false');
      drawer?.classList.remove('active');
      drawer?.setAttribute('aria-hidden', 'true');
      backdrop?.classList.remove('active');
    };

    hamburgerBtn?.addEventListener('click', () => {
      if (drawer?.classList.contains('active')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    closeBtn?.addEventListener('click', () => {
      closeDrawer();
      soundSynth.playClick();
    });

    backdrop?.addEventListener('click', () => {
      closeDrawer();
    });

    backdrop?.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Close drawer on nav item tap and scroll smoothly
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-target');
        closeDrawer();
        soundSynth.playClick();
        if (targetId) {
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Mobile CV Dossier trigger
    mobileCvBtn?.addEventListener('click', () => {
      closeDrawer();
      soundSynth.playWarp();
      const modal = document.getElementById('cv-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    });

    // Mobile Presubmit Audit trigger
    mobilePresubmitChip?.addEventListener('click', () => {
      closeDrawer();
      HolodeckSandboxes.open('presubmit-runner');
    });

    // Mobile Audio trigger
    mobileAudioBtn?.addEventListener('click', () => {
      soundSynth.toggle();
      const isEnabled = soundSynth.isEnabled;
      mobileAudioBtn.classList.toggle('active', isEnabled);
      mobileAudioBtn.querySelector('.audio-label').textContent = isEnabled ? 'AUDIO ON' : 'AUDIO OFF';
      if (mobileAudioBars) mobileAudioBars.classList.toggle('animating', isEnabled);

      const desktopAudioBtn = document.getElementById('btn-audio-toggle');
      const desktopAudioBars = document.getElementById('hud-audio-bars');
      if (desktopAudioBtn) {
        desktopAudioBtn.classList.toggle('active', isEnabled);
        desktopAudioBtn.querySelector('.audio-label').textContent = isEnabled ? 'AUDIO ON' : 'AUDIO OFF';
      }
      if (desktopAudioBars) desktopAudioBars.classList.toggle('animating', isEnabled);
    });
  }

  // Active section indicator on scroll (Desktop HUD) & Smooth Navigation
  initScrollSpy() {
    const navLinks = document.querySelectorAll('.hud-nav-link');
    if (!navLinks.length) return;

    const sections = ['hero-section', 'git-stream-section', 'projects-section', 'explorer-section', 'timeline-section', 'skills-section', 'terminal-section'];

    // Desktop nav link click handlers with sound feedback & smooth scrolling
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            e.preventDefault();
            soundSynth.playClick();
            navLinks.forEach(l => l.classList.toggle('active', l === link));
            targetEl.scrollIntoView({ behavior: 'smooth' });
            if (history.pushState) {
              history.pushState(null, '', href);
            }
          }
        }
      });
    });

    // Brand link scroll to hero
    const brandLink = document.getElementById('hud-brand-link');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        const heroEl = document.getElementById('hero-section');
        if (heroEl) {
          e.preventDefault();
          soundSynth.playClick();
          navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#hero-section'));
          heroEl.scrollIntoView({ behavior: 'smooth' });
          if (history.pushState) {
            history.pushState(null, '', '#hero-section');
          }
        }
      });
    }

    // ScrollSpy to update active state while scrolling
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = document.getElementById(sections[i]);
        if (sec && sec.offsetTop <= scrollPos) {
          const targetHash = `#${sections[i]}`;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === targetHash);
          });
          break;
        }
      }
    }, { passive: true });
  }

  // Asynchronous background update for live telemetry
  updateLiveGitTelemetry() {
    const branchEl = document.getElementById('hud-branch');
    const commitEl = document.getElementById('hud-commit');
    const mobileBranchEl = document.getElementById('mobile-hud-branch');
    const mobileCommitEl = document.getElementById('mobile-hud-commit');
    const badge = document.getElementById('git-live-badge');

    if (branchEl) branchEl.textContent = this.gitData.activeBranch;
    if (commitEl) commitEl.textContent = this.gitData.headCommit;
    if (mobileBranchEl) mobileBranchEl.textContent = this.gitData.activeBranch;
    if (mobileCommitEl) mobileCommitEl.textContent = this.gitData.headCommit;

    if (badge) {
      badge.textContent = this.gitData.source;
      badge.classList.toggle('live', !!this.gitData.isLive);
    }
  }

  // 2. Hero Section
  renderHeroSection() {
    const subtitles = [
      "Lead Backend & AI/ML Engineer | Solutions Architect",
      "12 Years Hands-on Experience • Persistent Systems & Cybage Software",
      "Architecting Autonomous Multi-Agent AI Swarms & Vector RAG (Google ADK)",
      "Distributed Systems & High-Concurrency Backends (Python, FastAPI, Django, Go)",
      "Zero-Knowledge E2EE Cloud Storage & Chrome Manifest V3 DevTools"
    ];

    let subIndex = 0;
    const subEl = document.getElementById('hero-typewriter');
    let charIndex = subtitles[0].length;
    let isDeleting = true;

    const typeWriter = () => {
      if (!subEl) return;
      const currentText = subtitles[subIndex];

      if (isDeleting) {
        subEl.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        subEl.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
      }

      let speed = isDeleting ? 25 : 45;

      if (!isDeleting && charIndex === currentText.length) {
        speed = 2800; // Hold at full text
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        subIndex = (subIndex + 1) % subtitles.length;
        speed = 350;
      }

      setTimeout(typeWriter, speed);
    };

    // Hold the full initial subtitle so the user can read it immediately, then rotate
    setTimeout(typeWriter, 3200);

    // Stats counter
    const statsContainer = document.getElementById('hero-stats-grid');
    if (statsContainer) {
      statsContainer.innerHTML = PROFILE_DATA.careerStats.map(s => `
        <div class="stat-card">
          <div class="stat-val glow-text">${s.value}</div>
          <div class="stat-label">${s.label}</div>
          <div class="stat-sub">${s.sub}</div>
        </div>
      `).join('');
    }
  }

  // 3. Git Intelligence Stream
  renderGitStream() {
    const list = document.getElementById('git-commits-list');
    const badge = document.getElementById('git-live-badge');
    if (badge) {
      badge.textContent = this.gitData.source;
      badge.classList.toggle('live', !!this.gitData.isLive);
    }

    if (!list) return;

    list.innerHTML = this.gitData.commits.map(c => `
      <div class="commit-card" data-hash="${c.hash}">
        <div class="commit-header">
          <span class="commit-hash" title="Click to copy hash"><code>${c.hash}</code></span>
          <span class="commit-badge ${c.type}">${c.badge}</span>
          <span class="commit-date">${c.relativeDate}</span>
        </div>
        <div class="commit-msg">${c.message}</div>
        <div class="commit-footer">
          <span class="commit-author">${c.author} (${c.authorTag})</span>
          <span class="commit-stats">+${c.stats.additions} -${c.stats.deletions}</span>
        </div>
      </div>
    `).join('');

    // Click to copy commit hash
    list.querySelectorAll('.commit-card').forEach(card => {
      card.addEventListener('click', () => {
        const hash = card.getAttribute('data-hash');
        navigator.clipboard.writeText(hash);
        soundSynth.playClick();
        const code = card.querySelector('.commit-hash code');
        const orig = code.textContent;
        code.textContent = 'COPIED!';
        setTimeout(() => { code.textContent = orig; }, 1200);
      });
    });
  }

  // 4. Project Filter Tabs
  renderProjectFilters() {
    const filters = [
      { id: 'all', label: 'All Systems', count: this.projects.length },
      { id: 'ai', label: '🤖 AI Swarms', count: this.projects.filter(p => p.category === 'ai').length },
      { id: 'cloud', label: '🛡️ Cloud Storage', count: this.projects.filter(p => p.category === 'cloud').length },
      { id: 'extensions', label: '🧩 Chrome DevTools', count: this.projects.filter(p => p.category === 'extensions').length },
      { id: 'fullstack', label: '🌐 Fullstack & CMS', count: this.projects.filter(p => p.category === 'fullstack').length },
      { id: 'devops', label: '🐳 DevOps & CI', count: this.projects.filter(p => p.category === 'devops').length }
    ];

    const container = document.getElementById('project-filters-row');
    if (!container) return;

    container.innerHTML = filters.map(f => `
      <button class="filter-pill ${f.id === this.activeCategory ? 'active' : ''}" data-cat="${f.id}">
        ${f.label} <span class="pill-count">${f.count}</span>
      </button>
    `).join('');

    container.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        soundSynth.playWarp();
        container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-cat');
        this.renderProjectsGrid();
      });
    });

    // Search bar
    const searchInput = document.getElementById('project-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      soundSynth.playHover();
      this.renderProjectsGrid();
    });
  }

  // 5. Projects Grid with 3D Tilt Cards
  renderProjectsGrid() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    let filtered = this.projects;

    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.activeCategory);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery) ||
        p.techStack.some(s => s.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-projects-state">No architectures found matching your query.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="project-holo-card" id="project-${p.id}" data-id="${p.id}">
        <div class="card-glow-border"></div>
        <div class="card-inner">
          <div class="card-top">
            <span class="card-cat-badge ${p.badgeColor}">${p.categoryLabel}</span>
            <span class="card-status-pill">${p.badge}</span>
          </div>

          <h3 class="card-title">${p.title}</h3>
          <p class="card-desc">${p.description}</p>

          <div class="metrics-grid">
            ${p.metrics.map(m => `
              <div class="metric-cell">
                <span class="metric-lbl">${m.label}</span>
                <span class="metric-val text-cyan">${m.value}</span>
              </div>
            `).join('')}
          </div>

          <div class="tech-tags-wrap">
            ${p.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>

          <div class="card-actions">
            ${p.simulatorId ? `
              <button class="btn-launch-sim" data-sim="${p.simulatorId}">
                <span class="sim-icon">⚡</span> ${p.simulatorName}
              </button>
            ` : `
              <a href="${p.githubUrl}" target="_blank" class="btn-launch-sim btn-ext">
                <span>📁</span> View Source Code
              </a>
            `}
            <button class="btn-view-design" data-id="${p.id}" title="View Architecture Document">
              <span>📄</span> DESIGN.md
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach 3D Card tilt physics
    grid.querySelectorAll('.project-holo-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });

    // Attach simulator launch triggers
    grid.querySelectorAll('.btn-launch-sim[data-sim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const simId = btn.getAttribute('data-sim');
        HolodeckSandboxes.open(simId);
      });
    });

    // Attach DESIGN.md modal triggers
    grid.querySelectorAll('.btn-view-design').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const proj = this.projects.find(p => p.id === id);
        if (proj) this.showDesignModal(proj);
      });
    });
  }

  // Design modal
  showDesignModal(proj) {
    soundSynth.playWarp();
    const modal = document.getElementById('design-modal');
    const content = document.getElementById('design-modal-body');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.classList.add('modal-open');

    content.innerHTML = `
      <div class="design-modal-header">
        <span class="sandbox-badge cyan">${proj.categoryLabel}</span>
        <h2>${proj.title}</h2>
        <p class="text-dim">Repository Path: <code>${proj.relPath}</code> • <a href="${proj.githubUrl}" target="_blank" class="term-link">Open on GitHub</a></p>
      </div>
      <div class="design-content-block">
        <h3>Architecture Overview</h3>
        <p>${proj.description}</p>
        
        <h3>Key Technical Innovations & Engineering Rigor</h3>
        <ul>
          ${proj.features.map(f => `<li><strong>•</strong> ${f}</li>`).join('')}
        </ul>

        <h3>Performance & Engineering Metrics</h3>
        <div class="metrics-grid modal-metrics">
          ${proj.metrics.map(m => `
            <div class="metric-cell">
              <span class="metric-lbl">${m.label}</span>
              <span class="metric-val text-emerald">${m.value}</span>
            </div>
          `).join('')}
        </div>

        <h3>Tech Stack Ecosystem</h3>
        <div class="tech-tags-wrap">
          ${proj.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // 6. Career Timeline
  renderCareerTimeline() {
    const container = document.getElementById('career-timeline-container');
    if (!container) return;

    container.innerHTML = PROFILE_DATA.workExperience.map(w => `
      <div class="timeline-card">
        <div class="timeline-dot"></div>
        <div class="timeline-card-header">
          <div class="role-wrap">
            <h3 class="role-title">${w.role}</h3>
            <span class="company-name text-cyan">${w.company}</span>
          </div>
          <div class="period-badge">${w.period}</div>
        </div>
        <ul class="highlights-list">
          ${w.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `).join('') + `
      <div class="timeline-card edu-card">
        <div class="timeline-dot"></div>
        <div class="timeline-card-header">
          <div class="role-wrap">
            <h3 class="role-title">${PROFILE_DATA.education.degree}</h3>
            <span class="company-name text-purple">${PROFILE_DATA.education.institution}</span>
          </div>
          <div class="period-badge">${PROFILE_DATA.education.period}</div>
        </div>
        <p class="edu-desc">Comprehensive computer systems engineering, operating systems, networking algorithms, and distributed systems foundation.</p>
      </div>
    `;
  }

  // 7. Skills Arsenal
  renderSkillsArsenal() {
    const container = document.getElementById('skills-arsenal-container');
    if (!container) return;

    container.innerHTML = PROFILE_DATA.skillsArsenal.map(cat => `
      <div class="skill-category-card">
        <div class="cat-header">
          <span class="cat-icon">${cat.icon}</span>
          <h3 class="cat-title">${cat.category}</h3>
        </div>
        <div class="skills-list">
          ${cat.skills.map(s => `
            <div class="skill-bar-wrap">
              <div class="skill-label-row">
                <span class="skill-name">${s.name}</span>
                <span class="skill-pct">${s.level}%</span>
              </div>
              <div class="skill-track">
                <div class="skill-fill" style="width: ${s.level}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // 8. Global Events & Keyboard Shortcuts
  bindGlobalEvents() {
    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-backdrop')) {
          HolodeckSandboxes.close();
          const designModal = document.getElementById('design-modal');
          if (designModal) designModal.classList.remove('active');
          const cvModal = document.getElementById('cv-modal');
          if (cvModal) cvModal.classList.remove('active');
          const shareModal = document.getElementById('share-card-modal');
          if (shareModal) shareModal.classList.remove('active');
          document.body.classList.remove('modal-open');
          soundSynth.playClick();
        }
      });
    });

    // Share Card Modal Triggers
    const openShareModal = () => {
      soundSynth.playWarp();
      const modal = document.getElementById('share-card-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    };

    document.getElementById('btn-open-share')?.addEventListener('click', openShareModal);
    document.getElementById('btn-hero-share')?.addEventListener('click', openShareModal);
    document.getElementById('btn-mobile-share')?.addEventListener('click', () => {
      document.getElementById('mobile-nav-drawer')?.classList.remove('active');
      document.getElementById('mobile-drawer-backdrop')?.classList.remove('active');
      const hamburgerBtn = document.getElementById('btn-hamburger-toggle');
      hamburgerBtn?.classList.remove('active');
      hamburgerBtn?.setAttribute('aria-expanded', 'false');
      openShareModal();
    });

    // Mobile Search Trigger
    document.getElementById('btn-mobile-search')?.addEventListener('click', () => {
      document.getElementById('mobile-nav-drawer')?.classList.remove('active');
      document.getElementById('mobile-drawer-backdrop')?.classList.remove('active');
      const hamburgerBtn = document.getElementById('btn-hamburger-toggle');
      hamburgerBtn?.classList.remove('active');
      hamburgerBtn?.setAttribute('aria-expanded', 'false');
      soundSynth.playWarp();
      const palette = document.getElementById('command-palette-modal');
      if (palette) {
        palette.classList.add('active');
        document.body.classList.add('modal-open');
        document.getElementById('palette-input')?.focus();
      }
    });

    // Copy Share Link to Clipboard with Animated Feedback
    const copyBtn = document.getElementById('btn-copy-share-url');
    const copyInput = document.getElementById('share-url-copy-input');
    const copyToast = document.getElementById('copy-toast-msg');
    const copyIcon = document.getElementById('copy-status-icon');
    const copyText = document.getElementById('copy-status-text');

    copyBtn?.addEventListener('click', async () => {
      soundSynth.playClick();
      const urlToCopy = copyInput?.value || window.location.href;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(urlToCopy);
        } else if (copyInput) {
          copyInput.select();
          document.execCommand('copy');
        }

        if (copyIcon) copyIcon.textContent = '✓';
        if (copyText) copyText.textContent = 'Copied!';
        if (copyToast) copyToast.classList.add('show');

        setTimeout(() => {
          if (copyIcon) copyIcon.textContent = '📋';
          if (copyText) copyText.textContent = 'Copy Link';
          if (copyToast) copyToast.classList.remove('show');
        }, 2400);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    });

    // Native Device Share sheet
    const nativeShareBtn = document.getElementById('btn-native-share');
    if (nativeShareBtn) {
      nativeShareBtn.addEventListener('click', async () => {
        soundSynth.playClick();
        const shareData = {
          title: 'Abhijeet Raut — Lead Backend & AI/ML Engineer | Solutions Architect',
          text: 'Accomplished Lead Software Engineer and Solutions Architect with 12 years of hands-on experience (Persistent Systems & Cybage Software). Check out the interactive quantum portfolio & 14-project systems catalog:',
          url: copyInput?.value || window.location.href
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Error sharing:', err);
            }
          }
        } else {
          // Fallback to copy link
          copyBtn?.click();
        }
      });
    }

    // CV Modal trigger
    document.getElementById('btn-open-cv')?.addEventListener('click', () => {
      soundSynth.playWarp();
      const modal = document.getElementById('cv-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    });

    // Launch Swarm trigger in Hero
    document.getElementById('btn-hero-swarm')?.addEventListener('click', () => {
      HolodeckSandboxes.open('swarm-dag');
    });

    // Launch Presubmit in HUD
    document.getElementById('hud-presubmit-badge')?.addEventListener('click', () => {
      HolodeckSandboxes.open('presubmit-runner');
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        HolodeckSandboxes.close();
        document.getElementById('design-modal')?.classList.remove('active');
        document.getElementById('cv-modal')?.classList.remove('active');
        document.getElementById('share-card-modal')?.classList.remove('active');
        document.getElementById('mobile-nav-drawer')?.classList.remove('active');
        document.getElementById('mobile-drawer-backdrop')?.classList.remove('active');
        const hamburgerBtn = document.getElementById('btn-hamburger-toggle');
        hamburgerBtn?.classList.remove('active');
        hamburgerBtn?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
      } else if (e.key === '`' || e.key === '~') {
        const termInput = document.getElementById('term-input');
        if (termInput) {
          document.getElementById('terminal-section')?.scrollIntoView({ behavior: 'smooth' });
          termInput.focus();
        }
      }
    });
  }

  // 9. Live Telemetry Clock & Ping
  startLiveTelemetryClock() {
    const clockEl = document.getElementById('hud-clock');
    const pingEl = document.getElementById('hud-ping');

    setInterval(() => {
      const now = new Date();
      if (clockEl) {
        const utcStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        clockEl.textContent = utcStr;
      }
      if (pingEl && Math.random() > 0.65) {
        const ping = Math.floor(Math.random() * 8) + 10;
        pingEl.textContent = `${ping}ms`;
      }
    }, 1000);
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const app = new NexusPrimeApp();
  app.init();
});
