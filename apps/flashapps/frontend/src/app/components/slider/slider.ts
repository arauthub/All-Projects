import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { SliderBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, MatSliderModule],
  template: `
    <div class="slider-container">
      <label>{{ data.label }}</label>
      <mat-slider [min]="data.min_value" [max]="data.max_value" [step]="data.step" showTickMarks discrete>
        <input matSliderThumb>
      </mat-slider>
    </div>
  `,
  styles: `
    .slider-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `
})
export class SliderComponent {
  @Input() data!: SliderBlockValue;
}
