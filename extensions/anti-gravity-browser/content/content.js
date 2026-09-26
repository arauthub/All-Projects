/**
 * Anti-Gravity Web — Interactive Physics & Arcade Browser Engine
 * Manifest V3 Compliant Content Script
 * 
 * Features:
 * - High-visibility non-destructive DOM extraction & Zero-G levitation
 * - Instant 1-hit explosive shatter & element disappearance
 * - Text shard particles, multi-color spark bursts, canvas shockwaves & screen shake
 * - Asteroids rapid-fire twin laser cannons & spaceship ramming
 * - Click-to-shatter in all modes (bubble-wrap popping)
 * - Cosmic Black Hole (Right-click or 'B' key) vortex singularity
 * - Orbital Katamari absorption & growth
 * - Flawless smooth restoration back to original page layout
 */

(function () {
  // Prevent duplicate execution
  if (window.__antiGravityInitialized) return;
  window.__antiGravityInitialized = true;

  /**
   * Procedural Web Audio Synthesizer (Zero external dependencies)
   */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx && typeof AudioContext !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playLaser() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    playExplosion(combo = 1) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Noise buffer for explosive blast
      const duration = 0.28;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + combo * 100, now);
      filter.frequency.linearRampToValueAtTime(60, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      // 2. High-frequency crunch/pop tone
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      const pitch = 220 + combo * 60;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    playAbsorb() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.14);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }

    playGravityChange() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    playBlackHole() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    playVictory() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const now = this.ctx.currentTime + idx * 0.09;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    }

    playRestore() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [330, 440, 554, 659];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const now = this.ctx.currentTime + idx * 0.06;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    }
  }

  /**
   * Main Anti-Gravity Controller
   */
  class AntiGravityApp {
    constructor() {
      this.isActive = false;
      this.isRestoring = false;
      this.mode = 'asteroids'; // Default to exciting Asteroids mode!
      this.mouseTool = 'drag'; // 'drag' | 'tractor' | 'repulsor'
      this.gravity = { x: 0, y: 0, strength: 0.8, isZeroG: true }; // Start in Zero-G Levitation!
      this.elementsData = [];
      this.score = 0;
      this.elementsAbsorbed = 0;
      this.totalElements = 0;

      // Combo System
      this.combo = 0;
      this.lastHitTime = 0;

      this.sound = new SoundEngine();

      // Matter.js instances
      this.engine = null;
      this.walls = [];
      this.physicsBodies = [];
      this.mouseConstraint = null;

      // DOM Containers
      this.rootOverlay = null;
      this.vfxCanvas = null;
      this.vfxCtx = null;
      this.hud = null;

      // Animation & Loop
      this.animationFrameId = null;

      // Mouse and keyboard tracking
      this.mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      this.isMouseDown = false;
      this.keys = {};
      this.lastAutoFireTime = 0;

      // Asteroids mode state
      this.ship = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        speed: 5.5,
        lasers: [],
        lastShotTime: 0,
        thrusterParticles: []
      };

      // Katamari mode state
      this.katamari = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: 0,
        vy: 0,
        radius: 38,
        rotation: 0,
        speed: 5.2,
        attachedElements: []
      };

      // Cosmic Black Holes
      this.blackHoles = [];

      // Multi-Stage Progression (1 to 5: Easy to Nightmare)
      this.currentStage = 1;
      this.stageKills = 0;
      this.stageTargets = { 1: 5, 2: 8, 3: 12, 4: 15, 5: 20 };
      this.stageNames = {
        1: 'CADET ORBIT',
        2: 'DEBRIS SPLITTERS',
        3: 'COSMIC STORM',
        4: 'VORTEX SINGULARITY',
        5: 'QUANTUM CHAOS'
      };
      this.stageDiffs = {
        1: 'Easy',
        2: 'Normal',
        3: 'Hard',
        4: 'Extreme',
        5: 'Nightmare'
      };
      this.hazardPulsars = [];
      this.windTimer = 0;
      this.windStreak = null;
      this.singularityTimer = 0;
      this.quantumCountdown = 60;
      this.lastCountdownUpdate = 0;
      this.tutorialActive = false;

      // Particle VFX (sparks, text fragments, shockwaves)
      this.particles = [];
      this.textShards = [];
      this.shockwaves = [];

      this.initListeners();
    }

    initListeners() {
      // Listen for runtime messages from popup & background service worker
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
          if (msg.action === 'TOGGLE_ANTIGRAVITY') {
            if (this.isActive) {
              this.restoreWebpage();
            } else {
              this.activate();
            }
            sendResponse({ isActive: this.isActive, mode: this.mode });
          } else if (msg.action === 'GET_STATUS') {
            sendResponse({
              isActive: this.isActive,
              mode: this.mode,
              mouseTool: this.mouseTool,
              gravity: this.gravity,
              score: this.score,
              totalElements: this.totalElements,
              remaining: this.physicsBodies.length,
              absorbed: this.elementsAbsorbed,
              muted: this.sound.muted,
              stage: this.currentStage,
              stageName: this.stageNames[this.currentStage],
              stageDiff: this.stageDiffs[this.currentStage],
              stageKills: this.stageKills,
              stageTarget: this.stageTargets[this.currentStage]
            });
          } else if (msg.action === 'SET_MODE') {
            this.setMode(msg.mode);
            sendResponse({ success: true, mode: this.mode });
          } else if (msg.action === 'SET_STAGE') {
            this.setStage(msg.stage);
            sendResponse({ success: true, stage: this.currentStage });
          } else if (msg.action === 'SHOW_TUTORIAL') {
            if (!this.isActive) {
              this.activate();
            }
            this.openTutorialModal();
            sendResponse({ success: true });
          } else if (msg.action === 'SET_GRAVITY') {
            this.setGravity(msg.x, msg.y, msg.strength, msg.isZeroG);
            sendResponse({ success: true, gravity: this.gravity });
          } else if (msg.action === 'SET_MOUSE_TOOL') {
            this.mouseTool = msg.tool;
            this.updateMouseConstraintState();
            sendResponse({ success: true, tool: this.mouseTool });
          } else if (msg.action === 'TOGGLE_SOUND') {
            this.sound.muted = !this.sound.muted;
            sendResponse({ success: true, muted: this.sound.muted });
          } else if (msg.action === 'RESTORE') {
            this.restoreWebpage();
            sendResponse({ success: true, isActive: false });
          }
          return true;
        });
      }

      // Global hotkeys
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;

        if (e.key === 'Escape' && this.isActive) {
          e.preventDefault();
          this.restoreWebpage();
          return;
        }

        if (!this.isActive) return;

        // Gravity Reversal & Direction Controls via Arrow keys
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.setGravity(0, -1, this.gravity.strength, false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.setGravity(0, 1, this.gravity.strength, false);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.setGravity(-1, 0, this.gravity.strength, false);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.setGravity(1, 0, this.gravity.strength, false);
        } else if (e.key === '0' || e.key.toLowerCase() === 'z') {
          e.preventDefault();
          this.setGravity(0, 0, 0, true);
        }

        // Black Hole Singularity trigger via 'B' or 'X'
        if (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'x') {
          e.preventDefault();
          this.spawnBlackHole(this.mousePos.x, this.mousePos.y);
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      window.addEventListener('mousemove', (e) => {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
      });

      window.addEventListener('mousedown', (e) => {
        if (!this.isActive) return;
        this.isMouseDown = true;

        // Right-click: Spawn Black Hole Singularity
        if (e.button === 2) {
          e.preventDefault();
          this.spawnBlackHole(e.clientX, e.clientY);
          return;
        }

        // In Asteroids mode: left click shoots twin lasers
        if (this.mode === 'asteroids' && e.button === 0) {
          if (!e.target.closest('#antigravity-hud')) {
            this.fireLaser();
          }
        }
      });

      window.addEventListener('mouseup', () => {
        this.isMouseDown = false;
      });

      // Prevent context menu while active to allow right-click Black Hole
      window.addEventListener('contextmenu', (e) => {
        if (this.isActive) {
          e.preventDefault();
        }
      });

      // Window resize handler
      window.addEventListener('resize', () => {
        if (this.isActive && this.vfxCanvas) {
          this.vfxCanvas.width = window.innerWidth;
          this.vfxCanvas.height = window.innerHeight;
          this.updateBoundaries();
        }
      });
    }

    /**
     * Activate Anti-Gravity Mode on current page
     */
    activate() {
      if (this.isActive || this.isRestoring) return;
      if (typeof Matter === 'undefined') {
        console.error('[Anti-Gravity Web] Matter.js physics engine is not loaded.');
        return;
      }

      this.isActive = true;
      this.score = 0;
      this.combo = 0;
      this.lastHitTime = 0;
      this.elementsAbsorbed = 0;
      this.particles = [];
      this.textShards = [];
      this.shockwaves = [];
      this.blackHoles = [];
      this.ship.lasers = [];
      this.katamari.attachedElements = [];
      this.katamari.radius = 38;

      // Start in Zero-G Levitation!
      this.gravity = { x: 0, y: 0, strength: 0.8, isZeroG: true };

      // 1. Create Sandbox Root Overlay
      this.createOverlay();

      // 2. Extract Visible Semantic DOM Elements
      this.extractDOMElements();

      // 3. Initialize Matter.js Physics Engine & Boundaries
      this.initPhysics();

      // 4. Create On-screen HUD
      this.createHUD();

      // 5. Start Render & Physics loop
      this.startLoop();

      // Reset Stage State
      this.currentStage = 1;
      this.stageKills = 0;
      this.hazardPulsars = [];
      this.windTimer = 0;
      this.windStreak = null;
      this.singularityTimer = 0;
      this.quantumCountdown = 60;

      // Audio cue
      this.sound.playGravityChange();

      // Check if first time user, auto-show tutorial
      try {
        if (!localStorage.getItem('ag_tutorial_seen')) {
          setTimeout(() => this.openTutorialModal(), 350);
        }
      } catch (e) {}

      // Notify background
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && chrome.runtime.id) {
          chrome.runtime.sendMessage({ action: 'UPDATE_STATUS', isActive: true }).catch(() => {});
        }
      } catch (e) {}
    }

    /**
     * Create isolated overlay container and canvas
     */
    createOverlay() {
      this.rootOverlay = document.createElement('div');
      this.rootOverlay.id = 'antigravity-sandbox-root';

      // VFX Canvas for lasers, ship, Katamari, particles, energy lines, Black Hole
      this.vfxCanvas = document.createElement('canvas');
      this.vfxCanvas.id = 'antigravity-vfx-canvas';
      this.vfxCanvas.width = window.innerWidth;
      this.vfxCanvas.height = window.innerHeight;
      this.vfxCtx = this.vfxCanvas.getContext('2d');
      this.rootOverlay.appendChild(this.vfxCanvas);

      document.body.appendChild(this.rootOverlay);
    }

    /**
     * Extracts visible semantic elements without breaking background layout
     * Preserves typography, gradients, colors, images, and buttons with high visual prominence.
     */
    extractDOMElements() {
      this.elementsData = [];
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 1. High-level card and widget containers that float as complete solid objects
      const cardSelectors = ['.card', 'article', '.quote-box', 'blockquote'];
      const topCards = Array.from(document.querySelectorAll(cardSelectors.join(', '))).filter(el => {
        if (el.closest('#antigravity-sandbox-root') || el.closest('#antigravity-hud') || el.closest('.test-helper')) return false;
        const r = el.getBoundingClientRect();
        return r.width >= 120 && r.height >= 50 && r.bottom > 10 && r.top < viewportHeight - 10;
      });

      // 2. Standalone semantic elements (headings, buttons, paragraphs, images) NOT inside the picked cards
      const semanticSelectors = [
        'h1', 'h2', 'h3', 'h4',
        'p.lead', 'p',
        'button', 'a.btn', 'a.button', '[role="button"]',
        '.btn-group > button', '.btn-group > a',
        'img', '.badge'
      ];

      const looseElements = Array.from(document.querySelectorAll(semanticSelectors.join(', '))).filter(el => {
        if (el.closest('#antigravity-sandbox-root') || el.closest('#antigravity-hud') || el.closest('.test-helper')) return false;
        // Skip if inside any of the selected top cards (cards float as single objects!)
        if (topCards.some(card => card.contains(el))) return false;

        const r = el.getBoundingClientRect();
        return (
          r.width >= 24 &&
          r.height >= 14 &&
          r.width <= viewportWidth * 0.94 &&
          r.height <= viewportHeight * 0.85 &&
          r.bottom > 10 &&
          r.top < viewportHeight - 10 &&
          r.right > 10 &&
          r.left < viewportWidth - 10
        );
      });

      // Combine cards and loose elements, deduplicate
      const allCandidates = [...topCards, ...looseElements];
      const uniqueElements = Array.from(new Set(allCandidates));

      // Filter visible
      const validElements = uniqueElements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0.15;
      });

      // Filter redundant ancestors
      const finalElements = validElements.filter(elA => {
        return !validElements.some(elB => elA !== elB && elA.contains(elB));
      }).slice(0, 48);

      this.totalElements = finalElements.length;

      // Clone elements and place in overlay
      finalElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        // 1. Create detached clone FIRST (while original is still visible and fully styled!)
        const clone = el.cloneNode(true);
        clone.classList.add('ag-physics-body');
        clone.setAttribute('data-ag-id', index.toString());

        // 2. Guarantee clone and all its children are fully visible
        clone.style.visibility = 'visible';
        clone.style.opacity = '1';
        clone.style.display = 'block';
        clone.querySelectorAll('*').forEach((child) => {
          child.style.visibility = 'visible';
          child.style.opacity = '1';
        });

        // 3. Now hide original element on host page so its layout slot is preserved
        const originalVisibility = el.style.visibility;
        el.style.visibility = 'hidden';

        // Set dimensions & absolute coordinates matching original
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.margin = '0';
        clone.style.boxSizing = 'border-box';
        clone.style.position = 'absolute';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.zIndex = '30';

        // Ensure high contrast & preserve background
        const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
        const hasGradient = style.backgroundImage && style.backgroundImage !== 'none';

        if (!hasBg && !hasGradient) {
          // If original had no background, wrap in a sleek dark floating glass pane
          clone.style.background = 'rgba(15, 23, 42, 0.82)';
          clone.style.backdropFilter = 'blur(10px)';
          clone.style.borderRadius = style.borderRadius !== '0px' ? style.borderRadius : '10px';
          clone.style.padding = style.padding !== '0px' ? style.padding : '8px 12px';
        } else {
          if (hasBg) clone.style.backgroundColor = style.backgroundColor;
          if (hasGradient) clone.style.backgroundImage = style.backgroundImage;
          clone.style.borderRadius = style.borderRadius;
          clone.style.padding = style.padding;
        }

        clone.style.color = style.color;
        clone.style.fontSize = style.fontSize;
        clone.style.fontFamily = style.fontFamily;
        clone.style.fontWeight = style.fontWeight;
        clone.style.lineHeight = style.lineHeight;

        // Initial transform positioned at its original location
        clone.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) rotate(0rad)`;

        // CLICK-TO-SHATTER: In all modes, clicking an element shatters and destroys it immediately!
        clone.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetBody = this.physicsBodies.find((b) => b.agData?.cloneElement === clone);
          if (targetBody) {
            this.shatterElement(targetBody, e.clientX, e.clientY);
          }
        });

        this.rootOverlay.appendChild(clone);

        this.elementsData.push({
          originalElement: el,
          originalVisibility: originalVisibility,
          cloneElement: clone,
          origX: rect.left,
          origY: rect.top,
          width: rect.width,
          height: rect.height,
          body: null
        });
      });
    }

    /**
     * Initializes Matter.js Engine, Bodies, and Walls with Zero-G Levitation
     */
    initPhysics() {
      const { Engine, Bodies, Composite, Mouse, MouseConstraint } = Matter;

      this.engine = Engine.create({
        gravity: {
          x: 0,
          y: 0,
          scale: 0
        }
      });

      this.physicsBodies = [];
      const worldBodies = [];

      // Create perimeter boundary walls
      this.createBoundaries();

      // Create physics bodies for cloned elements
      this.elementsData.forEach((item) => {
        const cx = item.origX + item.width / 2;
        const cy = item.origY + item.height / 2;

        const body = Bodies.rectangle(cx, cy, item.width, item.height, {
          restitution: 0.85,
          friction: 0.1,
          frictionAir: 0.015,
          density: 0.0012
        });

        // Attach custom properties
        body.agData = item;
        item.body = body;

        // Zero-G Initial Space Levitation: gentle upward drift and rotation
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 1.6,
          y: -0.3 - Math.random() * 0.9 // Float gently upward!
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.025);

        this.physicsBodies.push(body);
        worldBodies.push(body);
      });

      Composite.add(this.engine.world, worldBodies);

      // Setup MouseConstraint for Drag & Throw
      const mouse = Mouse.create(this.rootOverlay);
      this.mouseConstraint = MouseConstraint.create(this.engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.25,
          render: { visible: false }
        }
      });

      Composite.add(this.engine.world, this.mouseConstraint);
      this.updateMouseConstraintState();

      // Visual feedback when grabbing
      Matter.Events.on(this.mouseConstraint, 'startdrag', (evt) => {
        if (evt.body && evt.body.agData?.cloneElement) {
          evt.body.agData.cloneElement.classList.add('ag-grabbed');
        }
      });

      Matter.Events.on(this.mouseConstraint, 'enddrag', (evt) => {
        if (evt.body && evt.body.agData?.cloneElement) {
          evt.body.agData.cloneElement.classList.remove('ag-grabbed');
        }
      });
    }

    /**
     * Create screen boundary walls inside viewport
     */
    createBoundaries() {
      const { Bodies, Composite } = Matter;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const wallThickness = 100;

      // Remove existing walls if resizing
      if (this.walls.length > 0) {
        Composite.remove(this.engine.world, this.walls);
        this.walls = [];
      }

      const wallOpts = { isStatic: true, restitution: 0.9, friction: 0.1 };

      const ground = Bodies.rectangle(w / 2, h + wallThickness / 2 - 5, w * 2, wallThickness, wallOpts);
      const ceiling = Bodies.rectangle(w / 2, -wallThickness / 2 + 5, w * 2, wallThickness, wallOpts);
      const leftWall = Bodies.rectangle(-wallThickness / 2 + 5, h / 2, wallThickness, h * 2, wallOpts);
      const rightWall = Bodies.rectangle(w + wallThickness / 2 - 5, h / 2, wallThickness, h * 2, wallOpts);

      this.walls = [ground, ceiling, leftWall, rightWall];
      Composite.add(this.engine.world, this.walls);
    }

    updateBoundaries() {
      if (this.engine) {
        this.createBoundaries();
      }
    }

    updateMouseConstraintState() {
      if (!this.mouseConstraint) return;
      if (this.mouseTool === 'drag') {
        this.mouseConstraint.collisionFilter.mask = 0xFFFFFFFF;
      } else {
        // Disable drag while using tractor or repulsor
        this.mouseConstraint.collisionFilter.mask = 0;
      }
    }

    /**
     * Sets gravity vector and notifies engine
     */
    setGravity(x, y, strength, isZeroG = false) {
      this.gravity.x = x;
      this.gravity.y = y;
      this.gravity.strength = strength !== undefined ? strength : this.gravity.strength;
      this.gravity.isZeroG = isZeroG;

      if (this.engine) {
        if (isZeroG) {
          this.engine.gravity.x = 0;
          this.engine.gravity.y = 0;
          this.engine.gravity.scale = 0;

          // Apply mild floating drift
          this.physicsBodies.forEach((b) => {
            Matter.Body.setVelocity(b, {
              x: (Math.random() - 0.5) * 1.5,
              y: (Math.random() - 0.5) * 1.5
            });
            Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.025);
          });
        } else {
          this.engine.gravity.scale = 0.001;
          this.engine.gravity.x = this.gravity.x * this.gravity.strength * 0.85;
          this.engine.gravity.y = this.gravity.y * this.gravity.strength * 0.85;
        }
      }

      this.sound.playGravityChange();
      this.updateHUDIndicators();
    }

    setMode(newMode) {
      this.mode = newMode;
      this.ship.x = window.innerWidth / 2;
      this.ship.y = window.innerHeight / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;

      this.katamari.x = window.innerWidth / 2;
      this.katamari.y = window.innerHeight / 2;
      this.katamari.vx = 0;
      this.katamari.vy = 0;

      this.updateHUDIndicators();
    }

    /**
     * Create interactive on-screen HUD badge
     */
    createHUD() {
      if (this.hud) this.hud.remove();

      this.hud = document.createElement('div');
      this.hud.id = 'antigravity-hud';
      this.hud.innerHTML = `
        <div class="ag-hud-header">
          <div class="ag-hud-title">
            <span>🌌</span> ANTI-GRAVITY
          </div>
          <div class="ag-hud-badge" id="ag-hud-state-badge">ACTIVE</div>
          <button class="ag-icon-btn" id="ag-hud-tutorial-btn" title="How to Play Tutorial" style="font-size: 13px;">❓</button>
          <button class="ag-icon-btn" id="ag-hud-minimize-btn" title="Minimize HUD">_</button>
        </div>
        <div class="ag-hud-body">
          <div class="ag-hud-mode-selector">
            <button class="ag-mode-btn ${this.mode === 'asteroids' ? 'ag-active' : ''}" data-mode="asteroids">🚀 Asteroids</button>
            <button class="ag-mode-btn ${this.mode === 'katamari' ? 'ag-active' : ''}" data-mode="katamari">🟡 Katamari</button>
            <button class="ag-mode-btn ${this.mode === 'sandbox' ? 'ag-active' : ''}" data-mode="sandbox">🌌 Sandbox</button>
          </div>

          <!-- Multi-Stage Progression Tracker -->
          <div class="ag-hud-stage-tracker" id="ag-hud-stage-box">
            <div class="ag-stage-info-row">
              <span>STAGE <b id="ag-hud-stage-num">1</b>/5: <span id="ag-hud-stage-name">CADET ORBIT</span></span>
              <span id="ag-hud-stage-diff" class="ag-stage-badge-easy">EASY</span>
            </div>
            <div class="ag-progress-bar-bg">
              <div class="ag-progress-bar-fill" id="ag-hud-stage-progress" style="width: 0%;"></div>
            </div>
          </div>

          <div class="ag-dpad-container">
            <div class="ag-gravity-indicator">
              <svg class="ag-gravity-arrow" id="ag-hud-gravity-arrow" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5">
                <path d="M12 5v14M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="ag-dpad-buttons">
              <button class="ag-dpad-btn" style="grid-column: 2; grid-row: 1;" id="ag-btn-up" title="Gravity Up">▲</button>
              <button class="ag-dpad-btn" style="grid-column: 1; grid-row: 2;" id="ag-btn-left" title="Gravity Left">◄</button>
              <button class="ag-dpad-btn ag-center" style="grid-column: 2; grid-row: 2;" id="ag-btn-zero" title="Zero Gravity">0-G</button>
              <button class="ag-dpad-btn" style="grid-column: 3; grid-row: 2;" id="ag-btn-right" title="Gravity Right">►</button>
              <button class="ag-dpad-btn" style="grid-column: 2; grid-row: 3;" id="ag-btn-down" title="Gravity Down">▼</button>
            </div>
          </div>

          <div class="ag-hud-row" id="ag-stats-row">
            <span>Score: <b id="ag-hud-score" style="color: #38bdf8;">0 pts</b></span>
            <span>Left: <b id="ag-hud-count" style="color: #f43f5e;">${this.totalElements}</b></span>
          </div>

          <div class="ag-hud-footer">
            <button class="ag-icon-btn" id="ag-hud-sound-btn" title="Toggle Sound FX">🔊</button>
            <button class="ag-restore-btn" id="ag-hud-restore-btn" title="Restore Page [ESC]">
              <span>↺</span> Restore Page
            </button>
          </div>
          <div class="ag-hotkey-hint">💡 <b>Click elements</b> to shatter • <b>Space/Click</b> shoots lasers • <b>B / Right-Click</b> for Black Hole</div>
        </div>
      `;

      this.rootOverlay.appendChild(this.hud);

      // HUD Event Listeners
      const minBtn = this.hud.querySelector('#ag-hud-minimize-btn');
      minBtn.addEventListener('click', () => {
        this.hud.classList.toggle('ag-minimized');
      });

      const tutBtn = this.hud.querySelector('#ag-hud-tutorial-btn');
      if (tutBtn) {
        tutBtn.addEventListener('click', () => {
          this.openTutorialModal();
        });
      }

      this.hud.querySelectorAll('.ag-mode-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          this.setMode(e.currentTarget.getAttribute('data-mode'));
        });
      });

      this.hud.querySelector('#ag-btn-up').addEventListener('click', () => this.setGravity(0, -1, this.gravity.strength, false));
      this.hud.querySelector('#ag-btn-down').addEventListener('click', () => this.setGravity(0, 1, this.gravity.strength, false));
      this.hud.querySelector('#ag-btn-left').addEventListener('click', () => this.setGravity(-1, 0, this.gravity.strength, false));
      this.hud.querySelector('#ag-btn-right').addEventListener('click', () => this.setGravity(1, 0, this.gravity.strength, false));
      this.hud.querySelector('#ag-btn-zero').addEventListener('click', () => this.setGravity(0, 0, 0, true));

      this.hud.querySelector('#ag-hud-sound-btn').addEventListener('click', (e) => {
        this.sound.muted = !this.sound.muted;
        e.currentTarget.textContent = this.sound.muted ? '🔇' : '🔊';
      });

      this.hud.querySelector('#ag-hud-restore-btn').addEventListener('click', () => {
        this.restoreWebpage();
      });

      this.updateHUDIndicators();
    }

    updateHUDIndicators() {
      if (!this.hud) return;

      // Update active mode buttons
      this.hud.querySelectorAll('.ag-mode-btn').forEach((btn) => {
        if (btn.getAttribute('data-mode') === this.mode) {
          btn.classList.add('ag-active');
        } else {
          btn.classList.remove('ag-active');
        }
      });

      // Update gravity arrow
      const arrow = this.hud.querySelector('#ag-hud-gravity-arrow');
      if (arrow) {
        if (this.gravity.isZeroG || (this.gravity.x === 0 && this.gravity.y === 0)) {
          arrow.style.transform = 'scale(0.3)';
          arrow.style.opacity = '0.3';
        } else {
          const angle = Math.atan2(this.gravity.y, this.gravity.x) * (180 / Math.PI) - 90;
          arrow.style.transform = `rotate(${angle}deg) scale(1)`;
          arrow.style.opacity = '1';
        }
      }

      // Stats row updates
      const scoreEl = this.hud.querySelector('#ag-hud-score');
      const countEl = this.hud.querySelector('#ag-hud-count');
      if (scoreEl) {
        if (this.mode === 'katamari') {
          scoreEl.textContent = `${this.elementsAbsorbed} rolled`;
        } else {
          scoreEl.textContent = `${this.score} pts`;
        }
      }
      if (countEl) {
        countEl.textContent = `${this.physicsBodies.length} left`;
      }

      // Stage Tracker updates
      const stageNumEl = this.hud.querySelector('#ag-hud-stage-num');
      const stageNameEl = this.hud.querySelector('#ag-hud-stage-name');
      const stageDiffEl = this.hud.querySelector('#ag-hud-stage-diff');
      const stageProgEl = this.hud.querySelector('#ag-hud-stage-progress');
      if (stageNumEl) stageNumEl.textContent = this.currentStage;
      if (stageNameEl) stageNameEl.textContent = this.stageNames[this.currentStage];
      if (stageDiffEl) {
        const diff = this.stageDiffs[this.currentStage];
        stageDiffEl.textContent = diff.toUpperCase();
        stageDiffEl.className = `ag-stage-badge-${diff.toLowerCase()}`;
      }
      if (stageProgEl) {
        const target = this.stageTargets[this.currentStage] || 10;
        const pct = Math.min(100, Math.floor((this.stageKills / target) * 100));
        stageProgEl.style.width = `${pct}%`;
      }
    }

    /**
     * Asteroids Mode: Twin Rapid-Fire Lasers
     */
    fireLaser() {
      const now = performance.now();
      if (now - this.ship.lastShotTime < 110) return; // Fire rate limit (rapid fire)
      this.ship.lastShotTime = now;

      // Wingtip laser cannons: Twin parallel beams!
      const angle = this.ship.angle;
      const wingOffset = 14;
      const noseDist = 18;

      // Left wingtip
      const lx = this.ship.x + Math.cos(angle) * noseDist - Math.sin(angle) * wingOffset;
      const ly = this.ship.y + Math.sin(angle) * noseDist + Math.cos(angle) * wingOffset;

      // Right wingtip
      const rx = this.ship.x + Math.cos(angle) * noseDist + Math.sin(angle) * wingOffset;
      const ry = this.ship.y + Math.sin(angle) * noseDist - Math.cos(angle) * wingOffset;

      const laserSpeed = 18;
      const vx = Math.cos(angle) * laserSpeed;
      const vy = Math.sin(angle) * laserSpeed;

      this.ship.lasers.push(
        { x: lx, y: ly, vx, vy, life: 55 },
        { x: rx, y: ry, vx, vy, life: 55 }
      );

      this.sound.playLaser();
    }

    /**
     * Cosmic Black Hole Singularity Cannon (Right-click or 'B' key)
     */
    spawnBlackHole(x, y) {
      this.blackHoles.push({
        x,
        y,
        radius: 0,
        maxRadius: 45,
        life: 140,
        maxLife: 140,
        rotation: 0
      });
      this.sound.playBlackHole();
      this.spawnScorePopup(x, y, '⚫ BLACK HOLE!');
    }

    /**
     * Main Animation & Physics Loop (60 FPS)
     */
    startLoop() {
      const update = () => {
        if (!this.isActive || this.isRestoring) return;

        // Auto-fire while holding space or left click in Asteroids mode
        if (this.mode === 'asteroids' && (this.keys['Space'] || this.isMouseDown)) {
          this.fireLaser();
        }

        // 1. Advance Matter.js physics engine
        Matter.Engine.update(this.engine, 1000 / 60);

        // 2. Synchronize Physics Bodies to Cloned DOM Elements
        this.syncDOMTransformations();

        // 3. Handle Mouse Tools (Tractor Beam or Repulsor)
        this.handleMouseForces();

        // 4. Update and Render Black Hole Gravitational Singularities
        this.updateAndRenderBlackHoles();

        // 5. Update and Render VFX Canvas (Lasers, Ship, Katamari, Sparks, Shockwaves)
        this.renderVFX();

        this.animationFrameId = requestAnimationFrame(update);
      };

      this.animationFrameId = requestAnimationFrame(update);
    }

    /**
     * Syncs position and rotation from Matter bodies to CSS transforms
     */
    syncDOMTransformations() {
      for (let i = 0; i < this.physicsBodies.length; i++) {
        const body = this.physicsBodies[i];
        const item = body.agData;
        if (!item || !item.cloneElement) continue;

        const x = body.position.x - item.width / 2;
        const y = body.position.y - item.height / 2;
        const angle = body.angle;

        item.cloneElement.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
      }
    }

    /**
     * Applies localized tractor beam or repulsor forces from mouse
     */
    handleMouseForces() {
      if (this.mouseTool === 'drag') return;

      const mx = this.mousePos.x;
      const my = this.mousePos.y;
      const radius = 280;

      for (let i = 0; i < this.physicsBodies.length; i++) {
        const body = this.physicsBodies[i];
        const dx = mx - body.position.x;
        const dy = my - body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10 && dist < radius) {
          const forceMag = (1 - dist / radius) * (this.mouseTool === 'tractor' ? 0.0035 : -0.007);
          const fx = (dx / dist) * forceMag;
          const fy = (dy / dist) * forceMag;

          Matter.Body.applyForce(body, body.position, { x: fx, y: fy });
        }
      }
    }

    /**
     * Update Black Hole vortex singularities: suck in nearby elements & implode them
     */
    updateAndRenderBlackHoles() {
      for (let i = this.blackHoles.length - 1; i >= 0; i--) {
        const bh = this.blackHoles[i];
        bh.life--;
        bh.rotation += 0.12;
        bh.radius = Math.sin((1 - bh.life / bh.maxLife) * Math.PI) * bh.maxRadius;

        // Gravitational pull on all floating bodies
        for (let j = this.physicsBodies.length - 1; j >= 0; j--) {
          const body = this.physicsBodies[j];
          const dx = bh.x - body.position.x;
          const dy = bh.y - body.position.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 320) {
            // Suction pull
            const pullForce = (1 - dist / 320) * 0.006;
            Matter.Body.applyForce(body, body.position, {
              x: (dx / dist) * pullForce,
              y: (dy / dist) * pullForce
            });

            // If sucked into the event horizon: INSTANT IMPLOSION & DISAPPEARANCE!
            if (dist < bh.radius + 20) {
              this.shatterElement(body, body.position.x, body.position.y, true);
            }
          }
        }

        if (bh.life <= 0) {
          this.blackHoles.splice(i, 1);
        }
      }
    }

    /**
     * Canvas VFX Rendering: Ship, Lasers, Katamari, Particles, Beams, Black Holes
     */
    renderVFX() {
      const ctx = this.vfxCtx;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Render Mouse Tool VFX
      this.renderMouseToolVFX(ctx);

      // Render Black Holes
      this.renderBlackHoles(ctx);

      // Render Active Game Mode
      if (this.mode === 'asteroids') {
        this.updateAndRenderAsteroids(ctx);
      } else if (this.mode === 'katamari') {
        this.updateAndRenderKatamari(ctx);
      }

      // Render Shockwaves
      this.renderShockwaves(ctx);

      // Render Stage Hazards & Cosmic Wind
      this.updateAndRenderStageHazards(ctx);

      // Render Text Shard Particles
      this.renderTextShards(ctx);

      // Render Particle Sparks
      this.renderParticles(ctx);
    }

    renderMouseToolVFX(ctx) {
      if (this.mouseTool === 'tractor') {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.8;
        const mx = this.mousePos.x;
        const my = this.mousePos.y;

        for (const body of this.physicsBodies) {
          const dist = Math.hypot(mx - body.position.x, my - body.position.y);
          if (dist < 260) {
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(body.position.x, body.position.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (this.mouseTool === 'repulsor') {
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.mousePos.x, this.mousePos.y, 65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderBlackHoles(ctx) {
      for (const bh of this.blackHoles) {
        ctx.save();
        ctx.translate(bh.x, bh.y);
        ctx.rotate(bh.rotation);

        // Accretion disk glow
        const grad = ctx.createRadialGradient(0, 0, bh.radius * 0.4, 0, 0, bh.radius * 2.2);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Singularity core (black abyss)
        ctx.fillStyle = '#000000';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius, 0, Math.PI * 2);
        ctx.fill();

        // Spiral accretion lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, bh.radius * 1.4, i * Math.PI / 2, i * Math.PI / 2 + 1.2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    /**
     * Asteroids Mode: Spaceship flight, twin lasers, ramming & collision
     */
    updateAndRenderAsteroids(ctx) {
      // 1. Ship controls & smooth angle tracking towards cursor
      const targetAngle = Math.atan2(this.mousePos.y - this.ship.y, this.mousePos.x - this.ship.x);
      let diff = targetAngle - this.ship.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.ship.angle += diff * 0.16;

      // Movement: WASD or Arrow Keys
      let thrustX = 0;
      let thrustY = 0;
      if (this.keys['KeyW'] || this.keys['KeyZ'] || this.keys['ArrowUp']) thrustY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) thrustY += 1;
      if (this.keys['KeyA'] || this.keys['KeyQ'] || this.keys['ArrowLeft']) thrustX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) thrustX += 1;

      if (thrustX !== 0 || thrustY !== 0) {
        const len = Math.hypot(thrustX, thrustY);
        this.ship.vx += (thrustX / len) * 0.7;
        this.ship.vy += (thrustY / len) * 0.7;

        // Spawn rocket thruster trail
        this.spawnThrusterExhaust();
      } else {
        // Damping
        this.ship.vx *= 0.94;
        this.ship.vy *= 0.94;
      }

      this.ship.x += this.ship.vx;
      this.ship.y += this.ship.vy;

      // Screen wrapping for ship
      if (this.ship.x < 0) this.ship.x = window.innerWidth;
      if (this.ship.x > window.innerWidth) this.ship.x = 0;
      if (this.ship.y < 0) this.ship.y = window.innerHeight;
      if (this.ship.y > window.innerHeight) this.ship.y = 0;

      // Spaceship Ramming: Ram into elements to shatter them!
      for (let j = this.physicsBodies.length - 1; j >= 0; j--) {
        const body = this.physicsBodies[j];
        const dist = Math.hypot(this.ship.x - body.position.x, this.ship.y - body.position.y);
        const hitRadius = Math.max(body.agData.width, body.agData.height) * 0.45;
        if (dist < hitRadius + 22) {
          // RAM SHATTER!
          this.shatterElement(body, this.ship.x, this.ship.y);
          this.ship.vx *= -0.5;
          this.ship.vy *= -0.5;
          break;
        }
      }

      // Render Thruster Exhaust
      this.renderThrusters(ctx);

      // 2. Draw Spaceship
      ctx.save();
      ctx.translate(this.ship.x, this.ship.y);
      ctx.rotate(this.ship.angle);

      // Ship Hull (Neon Cyan Vector Interceptor)
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-16, -14);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-16, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Cannons
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -14);
      ctx.lineTo(8, -14);
      ctx.moveTo(-4, 14);
      ctx.lineTo(8, 14);
      ctx.stroke();

      ctx.restore();

      // 3. Update & Render Lasers
      for (let i = this.ship.lasers.length - 1; i >= 0; i--) {
        const laser = this.ship.lasers[i];
        laser.x += laser.vx;
        laser.y += laser.vy;
        laser.life--;

        // Draw laser bolt
        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.x - laser.vx * 0.8, laser.y - laser.vy * 0.8);
        ctx.stroke();
        ctx.restore();

        // Laser vs Physics Bodies collision: 1-HIT INSTANT SHATTER & DISAPPEAR!
        let hit = false;
        for (let j = this.physicsBodies.length - 1; j >= 0; j--) {
          const body = this.physicsBodies[j];
          if (Matter.Bounds.contains(body.bounds, { x: laser.x, y: laser.y })) {
            hit = true;
            this.shatterElement(body, laser.x, laser.y);
            break;
          }
        }

        if (hit || laser.life <= 0) {
          this.ship.lasers.splice(i, 1);
        }
      }
    }

    spawnThrusterExhaust() {
      const angle = this.ship.angle + Math.PI;
      const speed = 3 + Math.random() * 4;
      this.ship.thrusterParticles.push({
        x: this.ship.x + Math.cos(angle) * 16,
        y: this.ship.y + Math.sin(angle) * 16,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 1.5,
        life: 1.0,
        color: Math.random() > 0.4 ? '#f59e0b' : '#38bdf8'
      });
    }

    renderThrusters(ctx) {
      for (let i = this.ship.thrusterParticles.length - 1; i >= 0; i--) {
        const tp = this.ship.thrusterParticles[i];
        tp.x += tp.vx;
        tp.y += tp.vy;
        tp.life -= 0.05;

        if (tp.life <= 0) {
          this.ship.thrusterParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = tp.color;
        ctx.globalAlpha = tp.life;
        ctx.shadowColor = tp.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 3.5 * tp.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /**
     * Instant 1-Hit Shatter and Disappearance of an Element!
     */
    shatterElement(body, hitX, hitY, isBlackHole = false) {
      const item = body.agData;
      const idx = this.physicsBodies.indexOf(body);
      if (idx !== -1) {
        this.physicsBodies.splice(idx, 1);
      }

      // Immediately remove from Matter.js world composite
      Matter.Composite.remove(this.engine.world, body);

      const px = hitX !== undefined ? hitX : body.position.x;
      const py = hitY !== undefined ? hitY : body.position.y;

      // Update Combo Streak
      const now = performance.now();
      if (now - this.lastHitTime < 1400) {
        this.combo = Math.min(8, this.combo + 1);
      } else {
        this.combo = 1;
      }
      this.lastHitTime = now;

      // Points calculation based on combo
      const basePoints = 100;
      const points = basePoints * this.combo;
      this.score += points;

      // 1. Text Shard Particles: Extract words from original element and fling them!
      if (item && item.originalElement) {
        const textContent = item.originalElement.textContent.trim();
        if (textContent.length > 0) {
          const words = textContent.split(/\s+/).filter(w => w.length > 1).slice(0, 5);
          words.forEach((word) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            this.textShards.push({
              text: word,
              x: px,
              y: py,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              angle: Math.random() * Math.PI * 2,
              vAngle: (Math.random() - 0.5) * 0.1,
              life: 1.0,
              color: '#38bdf8'
            });
          });
        }
      }

      // 2. Multi-color Particle Explosion Sparks
      const sparkColors = ['#38bdf8', '#f43f5e', '#fbbf24', '#ffffff', '#a855f7'];
      this.spawnSparks(px, py, sparkColors, 32);

      // 3. Shockwave Ring
      this.shockwaves.push({
        x: px,
        y: py,
        radius: 10,
        maxRadius: Math.max(60, Math.min(140, item.width * 0.7)),
        alpha: 1.0,
        color: isBlackHole ? '#c084fc' : '#38bdf8'
      });

      // 4. Trigger Screen Shake
      this.triggerScreenShake();

      // 5. Sound Effect
      this.sound.playExplosion(this.combo);

      // 6. Floating Score Popup
      let popupText = `+${points} PTS`;
      let isCombo = false;
      if (this.combo > 1) {
        popupText = `COMBO x${this.combo}! +${points}`;
        isCombo = true;
      }
      this.spawnScorePopup(px, py, popupText, isCombo);

      // 7. Instant Element Disappearance with scale pop animation
      if (item && item.cloneElement) {
        item.cloneElement.classList.add('ag-shattering');
        setTimeout(() => {
          item.cloneElement?.remove();
        }, 160);
      }

      // Stage Progression: Track Kills & Splitters Mechanic (Stage >= 2)
      this.stageKills++;
      if (this.currentStage >= 2 && !body.isFragment && item && (item.width > 70 || item.height > 35)) {
        this.spawnSplitterFragments(body, px, py);
      }

      // Check Stage Target Advance
      const stageTarget = this.stageTargets[this.currentStage] || 10;
      if (this.stageKills >= stageTarget && this.currentStage < 5) {
        this.advanceStage();
      }

      this.updateHUDIndicators();

      // Check Victory Condition: All elements cleared!
      if (this.physicsBodies.length === 0) {
        if (this.currentStage < 5) {
          this.advanceStage();
        } else {
          this.triggerVictoryCelebration();
        }
      }
    }

    triggerScreenShake() {
      if (!this.rootOverlay) return;
      this.rootOverlay.classList.remove('ag-screen-shake');
      void this.rootOverlay.offsetWidth; // Trigger reflow
      this.rootOverlay.classList.add('ag-screen-shake');
      setTimeout(() => {
        this.rootOverlay?.classList.remove('ag-screen-shake');
      }, 140);
    }

    triggerVictoryCelebration() {
      this.sound.playVictory();

      // Spawn fireworks across viewport
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const rx = 100 + Math.random() * (window.innerWidth - 200);
          const ry = 100 + Math.random() * (window.innerHeight - 200);
          this.spawnSparks(rx, ry, ['#38bdf8', '#f43f5e', '#fbbf24', '#4ade80'], 50);
          this.shockwaves.push({ x: rx, y: ry, radius: 10, maxRadius: 180, alpha: 1.0, color: '#facc15' });
        }, i * 200);
      }

      // Victory banner
      const banner = document.createElement('div');
      banner.className = 'ag-victory-banner';
      banner.innerHTML = `
        <div class="ag-victory-title">🏆 WEBPAGE CLEARED!</div>
        <div class="ag-victory-desc">Every element has been shattered into cosmic stardust!</div>
        <div style="font-size: 22px; font-weight: 800; color: #38bdf8;">Final Score: ${this.score} PTS</div>
        <button class="ag-restore-btn" style="padding: 10px 24px; font-size: 14px;" id="ag-victory-restore">
          ↺ Restore Webpage [ESC]
        </button>
      `;

      this.rootOverlay.appendChild(banner);
      banner.querySelector('#ag-victory-restore').addEventListener('click', () => {
        this.restoreWebpage();
      });
    }

    /**
     * Interactive Tutorial Modal ("How to Play")
     */
    openTutorialModal() {
      // Remove any existing tutorial overlay
      const existing = document.getElementById('ag-tutorial-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'ag-tutorial-overlay';
      overlay.innerHTML = `
        <div class="ag-tutorial-card">
          <div class="ag-tutorial-header">
            <div class="ag-tutorial-title">
              <span>🚀</span> Anti-Gravity Flight Academy
            </div>
            <button class="ag-icon-btn" id="ag-tut-close" style="color: #94a3b8; font-size: 16px; border: none; background: none; cursor: pointer;">✕</button>
          </div>

          <!-- Slide 1: Flight & Navigation -->
          <div class="ag-tutorial-slide ag-slide-active" data-slide="0">
            <div class="ag-slide-icon">🕹️</div>
            <div class="ag-slide-heading">Flight & Navigation Controls</div>
            <div class="ag-slide-desc">
              Steer your anti-gravity spacecraft or roll the Katamari sphere using responsive keyboard controls or mouse tracking.
            </div>
            <div class="ag-key-row">
              <span class="ag-key-pill">W</span>
              <span class="ag-key-pill">A</span>
              <span class="ag-key-pill">S</span>
              <span class="ag-key-pill">D</span>
              <span class="ag-key-pill">Arrow Keys</span>
              <span class="ag-key-pill">Mouse Aim</span>
            </div>
          </div>

          <!-- Slide 2: Twin Lasers & Shattering -->
          <div class="ag-tutorial-slide" data-slide="1">
            <div class="ag-slide-icon">🔫</div>
            <div class="ag-slide-heading">Lasers & 1-Hit Shattering</div>
            <div class="ag-slide-desc">
              Fire high-speed twin plasma cannons to shatter page elements into cosmic stardust! Or click any floating element directly to pop it like bubble wrap.
            </div>
            <div class="ag-key-row">
              <span class="ag-key-pill">Spacebar (Hold)</span>
              <span class="ag-key-pill">Left Click</span>
              <span class="ag-key-pill">Click Any Element</span>
            </div>
          </div>

          <!-- Slide 3: Black Holes & Gravity Inversion -->
          <div class="ag-tutorial-slide" data-slide="2">
            <div class="ag-slide-icon">⚫</div>
            <div class="ag-slide-heading">Cosmic Singularity & Gravity Vector</div>
            <div class="ag-slide-desc">
              Deploy an event horizon black hole that vacuums and implodes nearby debris. Invert gravity in any direction or toggle pure Zero-G float!
            </div>
            <div class="ag-key-row">
              <span class="ag-key-pill">Right Click</span>
              <span class="ag-key-pill">B or X Key</span>
              <span class="ag-key-pill">Arrow Keys</span>
              <span class="ag-key-pill">0 Key (Zero-G)</span>
            </div>
          </div>

          <!-- Slide 4: Multi-Stage Campaign & Restoration -->
          <div class="ag-tutorial-slide" data-slide="3">
            <div class="ag-slide-icon">🏆</div>
            <div class="ag-slide-heading">5-Stage Arcade & Layout Return</div>
            <div class="ag-slide-desc">
              Advance from <b>Stage 1: Cadet Orbit</b> to <b>Stage 5: Quantum Chaos</b>! Unlock splitters, space hazard pulsars, and gravitational storms. Press <b>Escape</b> anytime to return the webpage 100% untouched.
            </div>
            <div class="ag-key-row">
              <span class="ag-key-pill">5 Stages (Easy → Nightmare)</span>
              <span class="ag-key-pill">ESC (Restore Page)</span>
            </div>
          </div>

          <!-- Navigation Footer -->
          <div class="ag-tutorial-nav">
            <button class="ag-mode-btn" id="ag-tut-prev-btn" style="padding: 6px 14px; opacity: 0.5;">← Prev</button>
            <div class="ag-dots-container">
              <div class="ag-dot ag-dot-active" data-dot="0"></div>
              <div class="ag-dot" data-dot="1"></div>
              <div class="ag-dot" data-dot="2"></div>
              <div class="ag-dot" data-dot="3"></div>
            </div>
            <button class="ag-mode-btn ag-active" id="ag-tut-next-btn" style="padding: 6px 14px;">Next →</button>
          </div>
        </div>
      `;

      const targetParent = this.rootOverlay || document.body;
      targetParent.appendChild(overlay);

      let currentSlide = 0;
      const slides = overlay.querySelectorAll('.ag-tutorial-slide');
      const dots = overlay.querySelectorAll('.ag-dot');
      const prevBtn = overlay.querySelector('#ag-tut-prev-btn');
      const nextBtn = overlay.querySelector('#ag-tut-next-btn');
      const closeBtn = overlay.querySelector('#ag-tut-close');

      const setSlide = (index) => {
        currentSlide = index;
        slides.forEach((s, idx) => {
          if (idx === currentSlide) {
            s.classList.add('ag-slide-active');
          } else {
            s.classList.remove('ag-slide-active');
          }
        });

        dots.forEach((d, idx) => {
          if (idx === currentSlide) {
            d.classList.add('ag-dot-active');
          } else {
            d.classList.remove('ag-dot-active');
          }
        });

        prevBtn.style.opacity = currentSlide === 0 ? '0.4' : '1';
        if (currentSlide === slides.length - 1) {
          nextBtn.textContent = 'Blast Off! 🚀';
          nextBtn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
        } else {
          nextBtn.textContent = 'Next →';
          nextBtn.style.background = '';
        }
      };

      const closeTutorial = () => {
        try {
          localStorage.setItem('ag_tutorial_seen', 'true');
        } catch (e) {}
        overlay.remove();
      };

      prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) setSlide(currentSlide - 1);
      });

      nextBtn.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) {
          setSlide(currentSlide + 1);
        } else {
          closeTutorial();
        }
      });

      dots.forEach((d, idx) => {
        d.addEventListener('click', () => setSlide(idx));
      });

      closeBtn.addEventListener('click', closeTutorial);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeTutorial();
      });
    }

    /**
     * Show Stage Announcement Banner
     */
    showStageBanner(title, desc) {
      if (!this.rootOverlay) return;
      const existing = this.rootOverlay.querySelector('.ag-stage-banner');
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.className = 'ag-stage-banner';
      banner.innerHTML = `
        <div class="ag-stage-banner-title">${title}</div>
        <div class="ag-stage-banner-desc">${desc}</div>
      `;
      this.rootOverlay.appendChild(banner);
      setTimeout(() => banner.remove(), 2300);
    }

    /**
     * Set Stage / Difficulty Directly
     */
    setStage(stageNum) {
      this.currentStage = Math.max(1, Math.min(5, stageNum));
      this.stageKills = 0;
      if (this.currentStage >= 3) {
        this.spawnHazardPulsars();
      } else {
        this.hazardPulsars = [];
      }
      if (this.currentStage === 5) {
        this.quantumCountdown = 60;
      }

      // Ensure sufficient debris targets
      const needed = this.stageTargets[this.currentStage] || 10;
      if (this.physicsBodies.length < needed + 2) {
        const spawnCount = Math.max(4, (needed + 2) - this.physicsBodies.length);
        this.warpInReinforcements(spawnCount);
      }

      this.showStageBanner(
        `WARP TO STAGE ${this.currentStage}!`,
        `${this.stageNames[this.currentStage]} (${this.stageDiffs[this.currentStage].toUpperCase()})`
      );
      this.updateHUDIndicators();
    }

    /**
     * Advance to Next Campaign Stage
     */
    advanceStage() {
      if (this.currentStage < 5) {
        const prev = this.currentStage;
        this.currentStage++;
        this.stageKills = 0;
        this.score += 1500;
        this.sound.playVictory();

        this.showStageBanner(
          `🌟 STAGE ${prev} CLEARED! +1,500 PTS`,
          `ENTERING STAGE ${this.currentStage}: ${this.stageNames[this.currentStage]} (${this.stageDiffs[this.currentStage].toUpperCase()})`
        );

        // Ensure sufficient debris targets are active for the new stage!
        const needed = this.stageTargets[this.currentStage] || 10;
        if (this.physicsBodies.length < needed + 2) {
          const spawnCount = Math.max(5, (needed + 2) - this.physicsBodies.length);
          this.warpInReinforcements(spawnCount);
        }

        if (this.currentStage >= 3) {
          this.spawnHazardPulsars();
        }
        if (this.currentStage === 4) {
          // Spawn immediate singularity center screen
          this.spawnBlackHole(window.innerWidth / 2, window.innerHeight / 2);
        }
        if (this.currentStage === 5) {
          this.quantumCountdown = 60;
        }

        this.updateHUDIndicators();
      } else {
        this.triggerVictoryCelebration();
      }
    }

    /**
     * Warps in high-tech cosmic quantum debris so gameplay never stalls
     */
    warpInReinforcements(count = 4) {
      if (!this.rootOverlay || !this.engine) return;

      const labels = [
        '⚡ QUANTUM CORE',
        '💠 DATA PRISM',
        '🚀 SPACE DEBRIS',
        '⚛️ HYPER CELL',
        '🪐 ORBITAL SHARD',
        '🛡️ CYBER MATRIX',
        '✨ STAR DUST',
        '💎 CHRONO RELIC'
      ];

      const w = window.innerWidth;
      const h = window.innerHeight;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!this.isActive || !this.rootOverlay || !this.engine) return;

          const label = labels[Math.floor(Math.random() * labels.length)];
          const width = 115 + Math.floor(Math.random() * 45);
          const height = 44 + Math.floor(Math.random() * 18);

          // Pick edge spawn location
          let sx, sy, vx, vy;
          const side = Math.floor(Math.random() * 4); // 0: top, 1: bottom, 2: left, 3: right
          if (side === 0) {
            sx = 100 + Math.random() * (w - 200);
            sy = 40;
            vx = (Math.random() - 0.5) * 2;
            vy = 2 + Math.random() * 2;
          } else if (side === 1) {
            sx = 100 + Math.random() * (w - 200);
            sy = h - 60;
            vx = (Math.random() - 0.5) * 2;
            vy = -2 - Math.random() * 2;
          } else if (side === 2) {
            sx = 50;
            sy = 100 + Math.random() * (h - 200);
            vx = 2 + Math.random() * 2;
            vy = (Math.random() - 0.5) * 2;
          } else {
            sx = w - 120;
            sy = 100 + Math.random() * (h - 200);
            vx = -2 - Math.random() * 2;
            vy = (Math.random() - 0.5) * 2;
          }

          const el = document.createElement('div');
          el.className = 'ag-physics-body ag-reinforcement-debris';
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
          el.style.background = 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.95))';
          el.style.border = '1.5px solid #38bdf8';
          el.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.5), inset 0 0 10px rgba(56, 189, 248, 0.2)';
          el.style.borderRadius = '10px';
          el.style.color = '#f8fafc';
          el.style.fontSize = '11px';
          el.style.fontWeight = '800';
          el.style.letterSpacing = '0.5px';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.position = 'absolute';
          el.style.left = '0';
          el.style.top = '0';
          el.style.zIndex = '32';
          el.style.cursor = 'crosshair';
          el.style.userSelect = 'none';
          el.textContent = label;

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const b = this.physicsBodies.find(pb => pb.agData?.cloneElement === el);
            if (b) this.shatterElement(b, e.clientX, e.clientY);
          });

          this.rootOverlay.appendChild(el);

          const body = Matter.Bodies.rectangle(sx, sy, width, height, {
            restitution: 0.88,
            friction: 0.08,
            frictionAir: 0.015,
            density: 0.0012
          });

          body.agData = {
            cloneElement: el,
            originalElement: null,
            width: width,
            height: height
          };

          Matter.Body.setVelocity(body, { x: vx, y: vy });
          Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);

          this.physicsBodies.push(body);
          Matter.Composite.add(this.engine.world, body);

          // Warp-in spark ring
          this.spawnSparks(sx, sy, ['#38bdf8', '#c084fc', '#4ade80'], 20);
          this.shockwaves.push({ x: sx, y: sy, radius: 5, maxRadius: 70, alpha: 1.0, color: '#38bdf8' });
          this.updateHUDIndicators();
        }, i * 280);
      }
    }

    /**
     * Stage 2+: Spawn smaller tumbling fragment bodies when elements shatter
     */
    spawnSplitterFragments(parentBody, px, py) {
      const item = parentBody.agData;
      if (!item || item.width < 50 || item.height < 25) return;

      const halfW = Math.max(30, Math.floor(item.width * 0.45));
      const halfH = Math.max(20, Math.floor(item.height * 0.45));

      let text = 'Shard';
      if (item.originalElement) {
        const raw = item.originalElement.textContent.trim();
        if (raw) {
          const words = raw.split(/\s+/).filter(w => w.length > 1);
          if (words.length > 0) text = words[Math.floor(Math.random() * words.length)].slice(0, 8);
        }
      }

      for (let s = 0; s < 2; s++) {
        const offsetX = (s === 0 ? -1 : 1) * (halfW * 0.6);
        const fragX = px + offsetX;
        const fragY = py + (Math.random() - 0.5) * 16;

        const fragEl = document.createElement('div');
        fragEl.className = 'ag-physics-body ag-splitter-fragment';
        fragEl.style.width = `${halfW}px`;
        fragEl.style.height = `${halfH}px`;
        fragEl.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))';
        fragEl.style.border = '1px solid rgba(56, 189, 248, 0.7)';
        fragEl.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.4)';
        fragEl.style.borderRadius = '6px';
        fragEl.style.color = '#38bdf8';
        fragEl.style.fontSize = '11px';
        fragEl.style.fontWeight = 'bold';
        fragEl.style.display = 'flex';
        fragEl.style.alignItems = 'center';
        fragEl.style.justifyContent = 'center';
        fragEl.style.position = 'absolute';
        fragEl.style.left = '0';
        fragEl.style.top = '0';
        fragEl.style.zIndex = '35';
        fragEl.style.pointerEvents = 'auto';
        fragEl.style.cursor = 'crosshair';
        fragEl.textContent = text;

        fragEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const b = this.physicsBodies.find(pb => pb.agData?.cloneElement === fragEl);
          if (b) this.shatterElement(b, e.clientX, e.clientY);
        });

        this.rootOverlay.appendChild(fragEl);

        const fragBody = Matter.Bodies.rectangle(fragX, fragY, halfW, halfH, {
          restitution: 0.9,
          friction: 0.05,
          frictionAir: 0.012,
          density: 0.001
        });

        fragBody.isFragment = true;
        fragBody.agData = {
          cloneElement: fragEl,
          originalElement: null,
          width: halfW,
          height: halfH
        };

        const speed = 3.5 + Math.random() * 3.5;
        const angle = (s === 0 ? Math.PI : 0) + (Math.random() - 0.5) * 0.9;
        Matter.Body.setVelocity(fragBody, {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        });
        Matter.Body.setAngularVelocity(fragBody, (Math.random() - 0.5) * 0.08);

        this.physicsBodies.push(fragBody);
        Matter.Composite.add(this.engine.world, fragBody);
      }
    }

    /**
     * Stage 3+: Spawn hazard pulsars (spiked floating mines)
     */
    spawnHazardPulsars() {
      this.hazardPulsars = [];
      const count = this.currentStage >= 4 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        this.hazardPulsars.push({
          x: 100 + Math.random() * (window.innerWidth - 200),
          y: 100 + Math.random() * (window.innerHeight - 200),
          vx: (Math.random() - 0.5) * 2.8,
          vy: (Math.random() - 0.5) * 2.8,
          radius: 24,
          angle: Math.random() * Math.PI * 2,
          pulse: 0
        });
      }
    }

    /**
     * Stage 3-5 Mechanics: Gravitational Winds, Hazard Pulsars, and Quantum Supernova
     */
    updateAndRenderStageHazards(ctx) {
      if (this.currentStage < 3) return;

      // 1. Cosmic Storm Wind Pulses (Stage >= 3)
      this.windTimer++;
      if (this.windTimer % 320 === 0) {
        const angle = Math.random() * Math.PI * 2;
        const fx = Math.cos(angle) * 0.0045;
        const fy = Math.sin(angle) * 0.0045;
        for (const b of this.physicsBodies) {
          Matter.Body.applyForce(b, b.position, { x: fx, y: fy });
        }
        this.windStreak = {
          angle: angle,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          life: 30
        };
        this.spawnScorePopup(window.innerWidth / 2, 85, '⚠️ GRAVITATIONAL WIND PULSE!');
      }

      // Draw Wind Streak
      if (this.windStreak && this.windStreak.life > 0) {
        this.windStreak.life--;
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([24, 16]);
        ctx.beginPath();
        const len = window.innerWidth;
        const cos = Math.cos(this.windStreak.angle);
        const sin = Math.sin(this.windStreak.angle);
        ctx.moveTo(this.windStreak.x - cos * len, this.windStreak.y - sin * len);
        ctx.lineTo(this.windStreak.x + cos * len, this.windStreak.y + sin * len);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Hazard Pulsar Mines (Stage >= 3)
      for (const hp of this.hazardPulsars) {
        hp.x += hp.vx;
        hp.y += hp.vy;
        hp.angle += 0.04;
        hp.pulse += 0.08;

        // Bounce off canvas boundaries
        if (hp.x - hp.radius < 0) { hp.x = hp.radius; hp.vx *= -1; }
        if (hp.x + hp.radius > window.innerWidth) { hp.x = window.innerWidth - hp.radius; hp.vx *= -1; }
        if (hp.y - hp.radius < 0) { hp.y = hp.radius; hp.vy *= -1; }
        if (hp.y + hp.radius > window.innerHeight) { hp.y = window.innerHeight - hp.radius; hp.vy *= -1; }

        // Render Spiked Pulsar Mine
        ctx.save();
        ctx.translate(hp.x, hp.y);
        ctx.rotate(hp.angle);

        // Warning aura
        const pulseR = hp.radius + Math.sin(hp.pulse) * 6;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Mine Spikes
        ctx.fillStyle = '#f43f5e';
        const spikes = 6;
        for (let s = 0; s < spikes; s++) {
          const sa = (s / spikes) * Math.PI * 2;
          const sx = Math.cos(sa) * (hp.radius * 1.3);
          const sy = Math.sin(sa) * (hp.radius * 1.3);
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central glowing core
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, hp.radius);
        grad.addColorStop(0, '#fecdd3');
        grad.addColorStop(0.5, '#e11d48');
        grad.addColorStop(1, '#881337');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, hp.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Ship Collision with Hazard Pulsar
        if (this.mode === 'asteroids') {
          const dist = Math.hypot(this.ship.x - hp.x, this.ship.y - hp.y);
          if (dist < hp.radius + 18) {
            const knockAngle = Math.atan2(this.ship.y - hp.y, this.ship.x - hp.x);
            this.ship.vx += Math.cos(knockAngle) * 7.5;
            this.ship.vy += Math.sin(knockAngle) * 7.5;
            this.triggerScreenShake();
            this.spawnSparks(this.ship.x, this.ship.y, ['#f43f5e', '#fbbf24'], 14);
          }
        }
      }

      // 3. Wandering Singularities (Stage >= 4)
      if (this.currentStage >= 4) {
        this.singularityTimer++;
        if (this.singularityTimer % 550 === 0 && this.blackHoles.length < 2) {
          const bx = 120 + Math.random() * (window.innerWidth - 240);
          const by = 120 + Math.random() * (window.innerHeight - 240);
          this.spawnBlackHole(bx, by);
        }
      }

      // 4. Quantum Supernova Countdown (Stage 5)
      if (this.currentStage === 5) {
        const now = performance.now();
        if (now - this.lastCountdownUpdate > 1000) {
          this.lastCountdownUpdate = now;
          if (this.quantumCountdown > 0) {
            this.quantumCountdown--;
            if (this.quantumCountdown === 0) {
              this.triggerSupernovaBlast();
            }
          }
        }

        // Quantum violet vignette glow
        ctx.save();
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
      }
    }

    /**
     * Stage 5 Supernova Blast: Detonate everything!
     */
    triggerSupernovaBlast() {
      this.sound.playVictory();
      this.showStageBanner('💥 QUANTUM SUPERNOVA!', 'ALL REALMS OBLITERATED!');
      const remaining = [...this.physicsBodies];
      remaining.forEach((b, i) => {
        setTimeout(() => {
          this.shatterElement(b, b.position.x, b.position.y);
        }, i * 60);
      });
    }

    /**
     * Orbital Katamari Mode: Rolling sticky sphere logic
     */
    updateAndRenderKatamari(ctx) {
      // Katamari movement via WASD or Arrow Keys
      let moveX = 0;
      let moveY = 0;
      if (this.keys['KeyW'] || this.keys['KeyZ'] || this.keys['ArrowUp']) moveY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
      if (this.keys['KeyA'] || this.keys['KeyQ'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        this.katamari.vx += (moveX / len) * 0.65;
        this.katamari.vy += (moveY / len) * 0.65;
      } else {
        this.katamari.vx *= 0.95;
        this.katamari.vy *= 0.95;
      }

      this.katamari.x += this.katamari.vx;
      this.katamari.y += this.katamari.vy;
      this.katamari.rotation += Math.hypot(this.katamari.vx, this.katamari.vy) * 0.04;

      // Screen boundary bounce for Katamari
      const r = this.katamari.radius;
      if (this.katamari.x - r < 0) { this.katamari.x = r; this.katamari.vx *= -0.7; }
      if (this.katamari.x + r > window.innerWidth) { this.katamari.x = window.innerWidth - r; this.katamari.vx *= -0.7; }
      if (this.katamari.y - r < 0) { this.katamari.y = r; this.katamari.vy *= -0.7; }
      if (this.katamari.y + r > window.innerHeight) { this.katamari.y = window.innerHeight - r; this.katamari.vy *= -0.7; }

      // Collision Detection: Absorbing floating elements on contact!
      for (let i = this.physicsBodies.length - 1; i >= 0; i--) {
        const body = this.physicsBodies[i];
        const dist = Math.hypot(this.katamari.x - body.position.x, this.katamari.y - body.position.y);
        const elementSize = Math.max(body.agData.width, body.agData.height);

        // When touched: absorb element immediately!
        if (dist < this.katamari.radius + elementSize * 0.45) {
          this.absorbElement(body, i);
        }
      }

      // Update Attached Elements relative to Katamari rotation
      for (const att of this.katamari.attachedElements) {
        const currentAngle = att.relAngle + this.katamari.rotation;
        const targetX = this.katamari.x + Math.cos(currentAngle) * att.relDist - att.item.width / 2;
        const targetY = this.katamari.y + Math.sin(currentAngle) * att.relDist - att.item.height / 2;
        att.item.cloneElement.style.transform = `translate3d(${targetX.toFixed(1)}px, ${targetY.toFixed(1)}px, 0) rotate(${currentAngle.toFixed(3)}rad)`;
      }

      // Draw Katamari Core Sphere
      ctx.save();
      ctx.translate(this.katamari.x, this.katamari.y);
      ctx.rotate(this.katamari.rotation);

      // Glowing outer aura
      const auraGrad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.35);
      auraGrad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
      auraGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Main Katamari sphere
      const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      sphereGrad.addColorStop(0, '#fef08a');
      sphereGrad.addColorStop(0.6, '#eab308');
      sphereGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Characteristic segmented nubs
      ctx.fillStyle = '#a16207';
      const nubs = 8;
      for (let n = 0; n < nubs; n++) {
        const nubAngle = (n / nubs) * Math.PI * 2;
        const nx = Math.cos(nubAngle) * (r * 0.85);
        const ny = Math.sin(nubAngle) * (r * 0.85);
        ctx.beginPath();
        ctx.arc(nx, ny, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /**
     * Absorb element into Katamari
     */
    absorbElement(body, index) {
      this.physicsBodies.splice(index, 1);
      Matter.Composite.remove(this.engine.world, body);

      const item = body.agData;
      if (item && item.cloneElement) {
        item.cloneElement.classList.add('ag-absorbed');
      }

      const relAngle = Math.atan2(body.position.y - this.katamari.y, body.position.x - this.katamari.x) - this.katamari.rotation;
      const relDist = this.katamari.radius * 0.75;

      this.katamari.attachedElements.push({
        item: item,
        relDist: relDist,
        relAngle: relAngle
      });

      // Grow Katamari
      this.katamari.radius += Math.min(4.5, Math.sqrt(item.width * item.height) * 0.035);
      this.elementsAbsorbed++;
      this.score += 150;
      this.stageKills++;

      // Check Stage Target Advance
      const stageTarget = this.stageTargets[this.currentStage] || 10;
      if (this.stageKills >= stageTarget && this.currentStage < 5) {
        this.advanceStage();
      }

      // Golden suction sparks
      this.spawnSparks(body.position.x, body.position.y, ['#facc15', '#fef08a', '#ca8a04'], 18);
      this.sound.playAbsorb();
      this.spawnScorePopup(this.katamari.x, this.katamari.y - this.katamari.radius, '+ROLLED UP!');
      this.updateHUDIndicators();

      if (this.physicsBodies.length === 0) {
        if (this.currentStage < 5) {
          this.advanceStage();
        } else {
          this.triggerVictoryCelebration();
        }
      }
    }

    /**
     * Spawns multi-colored particle sparks
     */
    spawnSparks(x, y, colors, count = 24) {
      const colorList = Array.isArray(colors) ? colors : [colors];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 7.5;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colorList[Math.floor(Math.random() * colorList.length)],
          size: 2.5 + Math.random() * 3.5,
          life: 1.0,
          decay: 0.025 + Math.random() * 0.035
        });
      }
    }

    renderParticles(ctx) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    renderTextShards(ctx) {
      for (let i = this.textShards.length - 1; i >= 0; i--) {
        const ts = this.textShards[i];
        ts.x += ts.vx;
        ts.y += ts.vy;
        ts.angle += ts.vAngle;
        ts.life -= 0.02;

        if (ts.life <= 0) {
          this.textShards.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(ts.x, ts.y);
        ctx.rotate(ts.angle);
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.fillStyle = ts.color;
        ctx.globalAlpha = ts.life;
        ctx.shadowColor = ts.color;
        ctx.shadowBlur = 8;
        ctx.fillText(ts.text, 0, 0);
        ctx.restore();
      }
    }

    renderShockwaves(ctx) {
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += 5.5;
        sw.alpha -= 0.04;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          this.shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    spawnScorePopup(x, y, text, isCombo = false) {
      if (!this.rootOverlay) return;
      const popup = document.createElement('div');
      popup.className = `ag-score-popup ${isCombo ? 'ag-combo' : ''}`;
      popup.textContent = text;
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
      this.rootOverlay.appendChild(popup);
      setTimeout(() => popup.remove(), 850);
    }

    /**
     * Smooth Reversibility & Layout Restoration
     */
    restoreWebpage() {
      if (!this.isActive || this.isRestoring) return;
      this.isRestoring = true;

      // Cancel animation loop
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      this.sound.playRestore();

      // Animate cloned elements back to original coordinates
      this.elementsData.forEach((item) => {
        if (item.cloneElement) {
          item.cloneElement.classList.add('ag-restoring');
          item.cloneElement.style.transform = `translate3d(${item.origX}px, ${item.origY}px, 0) rotate(0rad)`;
        }
      });

      // Clear HUD and VFX
      if (this.hud) {
        this.hud.style.opacity = '0';
      }

      // Allow 650ms for smooth return transition
      setTimeout(() => {
        // Restore original page elements visibility
        this.elementsData.forEach((item) => {
          if (item.originalElement) {
            item.originalElement.style.visibility = item.originalVisibility;
          }
        });

        // Clean up Matter engine
        if (this.engine) {
          Matter.Composite.clear(this.engine.world, false);
          Matter.Engine.clear(this.engine);
          this.engine = null;
        }

        // Remove overlay root
        if (this.rootOverlay) {
          this.rootOverlay.remove();
          this.rootOverlay = null;
        }

        this.hud = null;
        this.vfxCanvas = null;
        this.vfxCtx = null;
        this.elementsData = [];
        this.physicsBodies = [];
        this.walls = [];
        this.isActive = false;
        this.isRestoring = false;

        // Notify background
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && chrome.runtime.id) {
            chrome.runtime.sendMessage({ action: 'UPDATE_STATUS', isActive: false }).catch(() => {});
          }
        } catch (e) {}
      }, 650);
    }
  }

  // Instantiate Anti-Gravity engine
  window.__antiGravityApp = new AntiGravityApp();
})();
