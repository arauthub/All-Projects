import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="progress-container">
      <p *ngIf="data.label">{{ data.label }}</p>
      <mat-progress-bar [mode]="data.mode" [value]="data.value"></mat-progress-bar>
    </div>
  `,
  styles: `
    .progress-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
  `
})
export class ProgressComponent {
  @Input() data!: ProgressBlockValue;
}
