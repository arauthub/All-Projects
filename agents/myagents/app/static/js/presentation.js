/**
 * app/static/js/presentation.js
 * Interactive Presentation Engine with Fullscreen Slide Mode, Keyboard Nav, and HTML Export.
 */

class PresentationEngine {
  constructor() {
    self = this;
    this.slides = [];
    this.currentIndex = 0;
    this.modalEl = document.getElementById("presentation-modal");
    this.stageEl = document.getElementById("presentation-stage");
    this.counterEl = document.getElementById("slide-counter");
    this.prevBtn = document.getElementById("btn-prev-slide");
    this.nextBtn = document.getElementById("btn-next-slide");
    this.exportBtn = document.getElementById("btn-export-deck");
    this.closeBtn = document.getElementById("btn-close-presentation");

    this.bindEvents();
  }

  setSlides(slides) {
    this.slides = slides || [];
    this.currentIndex = 0;
    this.renderCurrentSlide();
  }

  bindEvents() {
    if (this.prevBtn) this.prevBtn.addEventListener("click", () => this.prevSlide());
    if (this.nextBtn) this.nextBtn.addEventListener("click", () => this.nextSlide());
    if (this.closeBtn) this.closeBtn.addEventListener("click", () => this.close());
    if (this.exportBtn) this.exportBtn.addEventListener("click", () => this.exportStandaloneHTML());

    // Keyboard navigation
    window.addEventListener("keydown", (e) => {
      if (!this.modalEl || !this.modalEl.classList.contains("active")) return;
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.prevSlide();
      } else if (e.key === "Escape") {
        this.close();
      }
    });
  }

  open() {
    if (!this.slides || this.slides.length === 0) {
      alert("No presentation slides generated yet. Please run a mission first!");
      return;
    }
    if (this.modalEl) {
      this.modalEl.classList.add("active");
      this.renderCurrentSlide();
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.remove("active");
    }
  }

  nextSlide() {
    if (this.currentIndex < this.slides.length - 1) {
      this.currentIndex++;
      this.renderCurrentSlide();
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentSlide();
    }
  }

  renderCurrentSlide() {
    if (!this.stageEl || !this.slides || this.slides.length === 0) return;
    const slide = this.slides[this.currentIndex];
    const accent = slide.accent_color || "#6366f1";

    this.stageEl.style.borderLeft = `6px solid ${accent}`;
    this.stageEl.innerHTML = `
      <div class="fullscreen-slide-tag" style="color: ${accent}">
        ${slide.tag || "SLIDE " + (this.currentIndex + 1)}
      </div>
      <h1 class="fullscreen-slide-title">${slide.title}</h1>
      <h3 class="fullscreen-slide-sub">${slide.subtitle || ""}</h3>
      <ul class="fullscreen-slide-bullets">
        ${(slide.points || []).map(p => `<li>${p}</li>`).join("")}
      </ul>
    `;

    if (this.counterEl) {
      this.counterEl.textContent = `Slide ${this.currentIndex + 1} of ${this.slides.length}`;
    }

    if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentIndex === this.slides.length - 1;
  }

  exportStandaloneHTML() {
    if (!this.slides || this.slides.length === 0) return;
    const slidesJSON = JSON.stringify(this.slides, null, 2);
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Autonomous Multi-Agent Architecture Presentation</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin:0; font-family:'Outfit', sans-serif; background:#080c15; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; }
    .deck-container { width:90%; max-width:1000px; background:#0d1424; border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:3rem; box-shadow:0 20px 50px rgba(0,0,0,0.8); }
    .tag { font-size:0.85rem; font-weight:700; color:#6366f1; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:0.5rem; }
    h1 { font-size:2.2rem; margin:0 0 0.5rem 0; }
    h3 { font-size:1.1rem; color:#94a3b8; margin:0 0 1.5rem 0; font-weight:400; }
    ul { font-size:1.1rem; line-height:1.8; color:#cbd5e1; }
    .controls { display:flex; justify-content:space-between; margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.08); }
    button { background:#6366f1; color:#fff; border:none; padding:0.6rem 1.2rem; border-radius:8px; cursor:pointer; font-weight:600; }
  </style>
</head>
<body>
  <div class="deck-container">
    <div id="slide-box"></div>
    <div class="controls">
      <button onclick="prev()">← Previous</button>
      <span id="counter" style="color:#64748b; font-size:0.9rem;"></span>
      <button onclick="next()">Next →</button>
    </div>
  </div>
  <script>
    const slides = ${slidesJSON};
    let idx = 0;
    function render() {
      const s = slides[idx];
      document.getElementById('slide-box').innerHTML = '<div class="tag">' + (s.tag || '') + '</div><h1>' + s.title + '</h1><h3>' + (s.subtitle||'') + '</h3><ul>' + s.points.map(p => '<li>' + p + '</li>').join('') + '</ul>';
      document.getElementById('counter').innerText = 'Slide ' + (idx + 1) + ' of ' + slides.length;
    }
    function next() { if(idx < slides.length - 1) { idx++; render(); } }
    function prev() { if(idx > 0) { idx--; render(); } }
    window.addEventListener('keydown', e => { if(e.key === 'ArrowRight') next(); if(e.key === 'ArrowLeft') prev(); });
    render();
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multi_agent_presentation.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
