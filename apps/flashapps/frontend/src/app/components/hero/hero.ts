import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeroBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <section class="hero-container">
      <div class="split-screen">
        <!-- Visual Side -->
        <div class="visual-side" [style.background-image]="data.image ? (data.image.toString().startsWith('http') ? 'url(' + data.image + ')' : 'url(http://localhost:8000/media/images/' + data.image + ')') : 'url(assets/performance_engine_bokeh.png)'">
          <div class="overlay"></div>
        </div>
        
        <!-- Command Side -->
        <div class="command-side">
          <div class="command-center glass-panel hover-lift">
            <h2 class="technical-text accent-blue">Service Command Center</h2>
            <h1 class="main-title">{{ data.title }}</h1>
            <p class="subtitle" *ngIf="data.subtitle">{{ data.subtitle }}</p>
            
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Active Jobs</span>
                <span class="stat-value">24</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Bay Status</span>
                <span class="stat-value accent-blue">Optimal</span>
              </div>
            </div>

            <div class="actions">
              <a mat-flat-button class="bg-nitrous" *ngIf="data.button_text && data.button_url" [href]="data.button_url">
                <mat-icon>terminal</mat-icon>
                {{ data.button_text }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero-container {
      height: 80vh;
      overflow: hidden;
      background: var(--deep-charcoal);
    }
    .split-screen {
      display: flex;
      height: 100%;
    }
    .visual-side {
      flex: 1.5;
      background-size: cover;
      background-position: center;
      position: relative;
      clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 0%, var(--deep-charcoal) 100%);
    }
    .command-side {
      flex: 1;
      display: flex;
      align-items: center;
      padding-left: 2rem;
      position: relative;
      z-index: 2;
    }
    .command-center {
      padding: 3rem;
      width: 100%;
      max-width: 500px;
      margin-left: -100px;
    }
    .main-title {
      font-size: 3.5rem;
      font-weight: 700;
      line-height: 1;
      margin: 1rem 0;
      color: white;
    }
    .subtitle {
      font-size: 1.1rem;
      opacity: 0.7;
      margin-bottom: 2rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
      border-top: 1px solid var(--glass-border);
      padding-top: 1.5rem;
    }
    .stat-label {
      display: block;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.5;
    }
    .stat-value {
      font-family: 'Rajdhani', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
    }
    .bg-nitrous {
      background-color: var(--nitrous-blue);
      color: white;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 0.5rem 2rem;
    }
  `
})
export class HeroComponent {
  @Input() data!: HeroBlockValue;
}
