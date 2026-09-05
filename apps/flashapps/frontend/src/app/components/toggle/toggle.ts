import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToggleBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule],
  template: `
    <div class="toggle-container">
      <mat-slide-toggle [checked]="data.default_value">
        {{ data.label }}
      </mat-slide-toggle>
    </div>
  `,
  styles: `
    .toggle-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
  `
})
export class ToggleComponent {
  @Input() data!: ToggleBlockValue;
}
