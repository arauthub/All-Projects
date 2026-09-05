import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WagtailService } from '../../services/wagtail';
import { HeroComponent } from '../hero/hero';
import { FeatureComponent } from '../feature/feature';
import { CardComponent } from '../card/card';
import { TabsComponent } from '../tabs/tabs';
import { AccordionComponent } from '../accordion/accordion';
import { SliderComponent } from '../slider/slider';
import { ToggleComponent } from '../toggle/toggle';
import { ProgressComponent } from '../progress/progress';
import { TableComponent } from '../table/table';
import { StepperComponent } from '../stepper/stepper';

@Component({
  selector: 'app-snippet',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    FeatureComponent,
    CardComponent,
    TabsComponent,
    AccordionComponent,
    SliderComponent,
    ToggleComponent,
    ProgressComponent,
    TableComponent,
    StepperComponent
  ],
  template: `
    <div *ngIf="loading" class="snippet-loading">Loading snippet...</div>
    <div *ngIf="snippetData" class="snippet-content">
      <ng-container *ngFor="let block of snippetData.component">
        <app-hero *ngIf="block.type === 'hero'" [data]="block.value"></app-hero>
        <app-feature *ngIf="block.type === 'feature'" [data]="block.value"></app-feature>
        <app-card *ngIf="block.type === 'card'" [data]="block.value"></app-card>
        <app-tabs *ngIf="block.type === 'tabs'" [data]="block.value"></app-tabs>
        <app-accordion *ngIf="block.type === 'accordion'" [data]="block.value"></app-accordion>
        <app-slider *ngIf="block.type === 'slider'" [data]="block.value"></app-slider>
        <app-toggle *ngIf="block.type === 'toggle'" [data]="block.value"></app-toggle>
        <app-progress *ngIf="block.type === 'progress'" [data]="block.value"></app-progress>
        <app-table *ngIf="block.type === 'table'" [data]="block.value"></app-table>
        <app-stepper *ngIf="block.type === 'stepper'" [data]="block.value"></app-stepper>
      </ng-container>
    </div>
  `,
  styles: `
    .snippet-loading {
      padding: 1rem;
      text-align: center;
      font-style: italic;
      color: #777;
    }
  `
})
export class SnippetComponent implements OnInit {
  @Input() id!: number | string;
  private wagtailService = inject(WagtailService);

  snippetData: any;
  loading = true;

  ngOnInit() {
    if (this.id) {
      this.wagtailService.getSnippet(this.id).subscribe({
        next: (data) => {
          this.snippetData = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }
}
