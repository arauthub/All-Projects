import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="content-container" [innerHTML]="data"></div>
  `,
  styles: `
    .content-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
  `
})
export class ContentComponent {
  @Input() data!: string;
}
