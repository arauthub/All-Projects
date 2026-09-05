import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-stepper',
    standalone: true,
    imports: [CommonModule, MatStepperModule, MatButtonModule, MatIconModule],
    template: `
    <div class="stepper-wrapper glass-panel">
      <div class="header-flex">
        <mat-icon class="accent-blue">event_repeat</mat-icon>
        <h3 *ngIf="data.title" class="stepper-title technical-text">{{ data.title }}</h3>
      </div>
      
      <mat-stepper #stepper [linear]="false" class="custom-stepper">
        <mat-step *ngFor="let step of data.steps; let i = index">
          <ng-template matStepLabel>
            <span class="technical-text">{{ step.label }}</span>
          </ng-template>
          
          <div class="step-container">
            <!-- Icon selection mock for vehicle types -->
            <div class="vehicle-selector" *ngIf="i === 0">
              <div class="v-option glass-panel hover-lift">
                <mat-icon>directions_car</mat-icon>
                <span>Sedan</span>
              </div>
              <div class="v-option glass-panel hover-lift active">
                <mat-icon>precision_manufacturing</mat-icon>
                <span>SUV</span>
              </div>
              <div class="v-option glass-panel hover-lift">
                <mat-icon>two_wheeler</mat-icon>
                <span>Bike</span>
              </div>
            </div>

            <div class="step-content" [innerHTML]="step.content"></div>
          </div>

          <div class="stepper-actions">
            <button mat-button class="technical-text" matStepperPrevious *ngIf="!isFirst(step)">PREV_CMD</button>
            <button mat-flat-button class="bg-nitrous technical-text" matStepperNext *ngIf="!isLast(step)">NEXT_STEP</button>
            <button mat-flat-button color="warn" class="technical-text" (click)="stepper.reset()" *ngIf="isLast(step)">REBOOT_WFLOW</button>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
    styles: `
    .stepper-wrapper {
      margin: 4rem auto;
      padding: 3rem;
      max-width: 900px;
    }
    .header-flex {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stepper-title {
      margin: 0;
      font-size: 1.8rem;
    }
    .custom-stepper {
      background: transparent !important;
    }
    .step-container {
      padding: 3rem 0;
    }
    .vehicle-selector {
      display: flex;
      gap: 2rem;
      margin-bottom: 3rem;
    }
    .v-option {
      flex: 1;
      padding: 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
    }
    .v-option mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
    }
    .v-option.active {
      border-color: var(--nitrous-blue);
      background: rgba(0, 163, 255, 0.1);
    }
    .v-option span {
      font-family: 'Rajdhani', sans-serif;
      text-transform: uppercase;
      font-weight: 700;
    }
    .step-content {
      font-size: 1.1rem;
      line-height: 1.6;
      opacity: 0.8;
    }
    .stepper-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1.5rem;
      margin-top: 2rem;
      border-top: 1px solid var(--glass-border);
      padding-top: 2rem;
    }
    .bg-nitrous {
      background-color: var(--nitrous-blue);
      color: white;
    }
  `
})
export class StepperComponent {
    @Input() data!: {
        title?: string;
        steps: Array<{ label: string; content: string }>;
    };

    isFirst(step: any): boolean {
        return this.data.steps.indexOf(step) === 0;
    }

    isLast(step: any): boolean {
        return this.data.steps.indexOf(step) === this.data.steps.length - 1;
    }
}
