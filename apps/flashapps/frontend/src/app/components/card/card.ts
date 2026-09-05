import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CardBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="app-card glass-panel hover-lift">
      <div class="card-header-accent bg-nitrous"></div>
      <div class="image-wrapper" *ngIf="data.image">
        <img mat-card-image [src]="data.image.toString().startsWith('http') ? data.image : 'http://localhost:8000/media/images/' + data.image" alt="Service image">
        <div class="image-overlay"></div>
      </div>
      <mat-card-header>
        <div class="header-content">
          <mat-icon class="accent-blue">settings_suggest</mat-icon>
          <mat-card-title class="technical-text">{{ data.title }}</mat-card-title>
        </div>
      </mat-card-header>
      <mat-card-content>
        <div class="card-description" [innerHTML]="data.content"></div>
        <div class="card-footer">
          <span class="technical-text accent-blue">Status: Ready</span>
          <mat-icon>arrow_forward</mat-icon>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .app-card {
      background: var(--glass-bg) !important;
      color: var(--matte-silver);
      border: 1px solid var(--glass-border) !important;
      overflow: hidden;
      height: 100%;
      position: relative;
    }
    .card-header-accent {
      height: 4px;
      width: 40px;
      position: absolute;
      top: 0;
      left: 20px;
    }
    .image-wrapper {
      position: relative;
      height: 200px;
      overflow: hidden;
    }
    .image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(0.5);
      transition: filter 0.3s ease;
    }
    .app-card:hover .image-wrapper img {
      filter: grayscale(0);
    }
    .image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(0deg, var(--deep-charcoal) 0%, transparent 100%);
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }
    .technical-text {
      font-size: 1.2rem;
      margin: 0;
    }
    .card-description {
      margin: 1.5rem 0;
      font-size: 0.95rem;
      opacity: 0.7;
      line-height: 1.6;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--glass-border);
      padding-top: 1rem;
      margin-top: auto;
    }
    .card-footer mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
      opacity: 0.5;
    }
  `
})
export class CardComponent {
  @Input() data!: CardBlockValue;
}
