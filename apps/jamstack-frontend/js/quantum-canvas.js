/**
 * Nexus Prime - Quantum Canvas
 * Living 60 FPS interactive particle constellation & nebula field
 */

export class QuantumCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.pulses = [];
    this.particleCount = 75;
    this.maxDistance = 140;
    this.mouse = { x: -1000, y: -1000, radius: 160, isDown: false };
    this.animId = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    // Adjust particle density based on screen size
    if (width < 768) {
      this.particleCount = 40;
      this.maxDistance = 100;
    } else {
      this.particleCount = 75;
      this.maxDistance = 140;
    }
  }

  createParticles() {
    this.particles = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < this.particleCount; i++) {
      const isCyan = Math.random() > 0.45;
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2.2 + 1.2,
        baseRadius: Math.random() * 2.2 + 1.2,
        color: isCyan ? 'rgba(0, 245, 255, ' : 'rgba(139, 92, 246, ',
        glowColor: isCyan ? '#00f5ff' : '#8b5cf6',
        alpha: Math.random() * 0.6 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseVal: Math.random() * Math.PI
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    window.addEventListener('click', (e) => {
      this.triggerShockwave(e.clientX, e.clientY);
    });
  }

  triggerShockwave(x, y) {
    this.pulses.push({
      x,
      y,
      radius: 0,
      maxRadius: 280,
      alpha: 0.8,
      speed: 7
    });
  }

  animate() {
    if (document.hidden) {
      this.animId = requestAnimationFrame(() => this.animate());
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.ctx.clearRect(0, 0, width, height);

    // Draw active shockwaves
    for (let pIdx = this.pulses.length - 1; pIdx >= 0; pIdx--) {
      const pulse = this.pulses[pIdx];
      pulse.radius += pulse.speed;
      pulse.alpha -= 0.022;

      if (pulse.alpha <= 0 || pulse.radius >= pulse.maxRadius) {
        this.pulses.splice(pIdx, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(0, 245, 255, ${pulse.alpha})`;
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#00f5ff';
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Update and draw particles
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      // Oscillate radius subtly
      p.pulseVal += p.pulseSpeed;
      const currentRadius = p.baseRadius + Math.sin(p.pulseVal) * 0.5;

      // Mouse gravitation / repulsion
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.mouse.radius && dist > 0) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        const angle = Math.atan2(dy, dx);
        p.x -= Math.cos(angle) * force * 3.5;
        p.y -= Math.sin(angle) * force * 3.5;
      }

      // Shockwave push
      for (const pulse of this.pulses) {
        const pdx = p.x - pulse.x;
        const pdy = p.y - pulse.y;
        const pdist = Math.hypot(pdx, pdy);
        if (Math.abs(pdist - pulse.radius) < 30 && pdist > 0) {
          const pAngle = Math.atan2(pdy, pdx);
          p.x += Math.cos(pAngle) * 5;
          p.y += Math.sin(pAngle) * 5;
        }
      }

      // Velocity move
      p.x += p.vx;
      p.y += p.vy;

      // Screen edge wrapping
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Draw particle dot
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${p.alpha})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.glowColor;
      this.ctx.fill();

      // Connect lines
      for (let j = i + 1; j < len; j++) {
        const p2 = this.particles[j];
        const lineDx = p.x - p2.x;
        const lineDy = p.y - p2.y;
        const lineDist = Math.hypot(lineDx, lineDy);

        if (lineDist < this.maxDistance) {
          const lineAlpha = (1 - lineDist / this.maxDistance) * 0.35;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(0, 245, 255, ${lineAlpha})`;
          this.ctx.lineWidth = 0.85;
          this.ctx.stroke();
        }
      }
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
