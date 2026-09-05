import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { WagtailService } from '../../services/wagtail';
import { WagtailPage } from '../../models/wagtail';

import { HeroComponent } from '../hero/hero';
import { FeatureComponent } from '../feature/feature';
import { CardComponent } from '../card/card';
import { ContentComponent } from '../content/content';
import { TabsComponent } from '../tabs/tabs';
import { AccordionComponent } from '../accordion/accordion';
import { SliderComponent } from '../slider/slider';
import { ToggleComponent } from '../toggle/toggle';
import { ProgressComponent } from '../progress/progress';
import { SnippetComponent } from '../snippet/snippet';
import { TableComponent } from '../table/table';
import { StepperComponent } from '../stepper/stepper';

@Component({
  selector: 'app-modular-page',
  standalone: true,
  imports: [
    CommonModule,
    MatDividerModule,
    HeroComponent,
    FeatureComponent,
    CardComponent,
    ContentComponent,
    TabsComponent,
    AccordionComponent,
    SliderComponent,
    ToggleComponent,
    ProgressComponent,
    SnippetComponent,
    TableComponent,
    StepperComponent
  ],
  template: `
    <div class="debug-info" *ngIf="loading">Loading page {{currentId}}...</div>
    <div class="debug-info error" *ngIf="error">{{error}}</div>
    
    <div *ngIf="page">
      <div class="debug-info">
        <strong>Page:</strong> {{page.title}} (ID: {{page.id}}) | 
        <strong>Blocks:</strong> {{page.body.length || 0}}
        <button (click)="showJson = !showJson" mat-button color="accent">Toggle Raw JSON</button>
      </div>
      
      <pre *ngIf="showJson" class="json-preview">{{ page | json }}</pre>

      <ng-container *ngFor="let block of page.body">
        <app-hero *ngIf="block.type === 'hero'" [data]="block.value"></app-hero>
        <app-content *ngIf="block.type === 'content'" [data]="block.value"></app-content>
        
        <div class="features-grid" *ngIf="block.type === 'features'">
          <app-feature *ngFor="let feature of block.value" [data]="feature"></app-feature>
        </div>
        
        <div class="cards-grid" *ngIf="block.type === 'cards'">
          <app-card *ngFor="let card of block.value" [data]="card"></app-card>
        </div>

        <app-tabs *ngIf="block.type === 'tabs'" [data]="block.value"></app-tabs>
        <app-accordion *ngIf="block.type === 'accordion'" [data]="block.value"></app-accordion>
        <app-slider *ngIf="block.type === 'slider'" [data]="block.value"></app-slider>
        <app-toggle *ngIf="block.type === 'toggle'" [data]="block.value"></app-toggle>
        <app-progress *ngIf="block.type === 'progress'" [data]="block.value"></app-progress>
        <app-snippet *ngIf="block.type === 'snippet'" [id]="block.value"></app-snippet>
        <app-table *ngIf="block.type === 'table'" [data]="block.value"></app-table>
        <app-stepper *ngIf="block.type === 'stepper'" [data]="block.value"></app-stepper>
        <mat-divider *ngIf="block.type === 'divider'"></mat-divider>
      </ng-container>
    </div>
    
    <div *ngIf="page && (!page.body || page.body.length === 0)" class="debug-info">
      Page loaded but has no body content.
    </div>
  `,
  styles: `
    .features-grid, .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      padding: 2rem;
    }
    .debug-info {
      padding: 1rem;
      background: #f0f0f0;
      margin: 1rem;
      border: 1px solid #ccc;
    }
    .error {
      background: #ffe0e0;
      color: red;
      border-color: red;
    }
    .json-preview {
      background: #333;
      color: #0f0;
      padding: 1rem;
      margin: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.8rem;
    }
  `
})
export class ModularPageComponent implements OnInit {
  private wagtailService = inject(WagtailService);
  private route = inject(ActivatedRoute);

  page?: WagtailPage;
  loading = true;
  error?: string;
  currentId?: string;
  showJson = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.currentId = params['id'] || '3';
      const idToFetch = this.currentId as string;
      console.log('Loading page:', idToFetch);
      this.loading = true;
      this.error = undefined;

      this.wagtailService.getPage(idToFetch).subscribe({
        next: (page) => {
          console.log('Page loaded successfully:', page);
          this.page = page;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading page:', err);
          this.error = `Failed to load page ${this.currentId}: ${err.message}`;
          this.loading = false;
        }
      });
    });
  }
}
