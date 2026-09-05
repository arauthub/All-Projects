import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TabsBlockValue } from '../../models/wagtail';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, MatTabsModule],
  template: `
    <div class="tabs-container">
      <mat-tab-group animationDuration="500ms">
        <mat-tab *ngFor="let tab of data.tabs" [label]="tab.label">
          <div class="tab-body" [innerHTML]="tab.content"></div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    .tabs-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .tab-body {
      padding: 1.5rem;
      line-height: 1.6;
    }
  `
})
export class TabsComponent {
  @Input() data!: TabsBlockValue;
}
