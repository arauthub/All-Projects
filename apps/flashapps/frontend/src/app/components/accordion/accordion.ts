import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { AccordionBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule, MatExpansionModule],
  template: `
    <div class="accordion-container">
      <mat-accordion multi>
        <mat-expansion-panel *ngFor="let item of data.items">
          <mat-expansion-panel-header>
            <mat-panel-title>{{ item.header }}</mat-panel-title>
          </mat-expansion-panel-header>
          <div [innerHTML]="item.content"></div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: `
    .accordion-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
  `
})
export class AccordionComponent {
  @Input() data!: AccordionBlockValue;
}
