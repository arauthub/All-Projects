import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FeatureBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="feature-item">
      <mat-icon *ngIf="data.icon">{{ data.icon }}</mat-icon>
      <h3>{{ data.title }}</h3>
      <p>{{ data.description }}</p>
    </div>
  `,
  styles: `
    .feature-item {
      padding: 1rem;
      text-align: center;
    }
    mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #3f51b5;
    }
  `
})
export class FeatureComponent {
  @Input() data!: FeatureBlockValue;
}
