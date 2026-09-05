import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'app-table',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatIconModule, MatProgressBarModule],
    template: `
    <div class="table-container glass-panel hover-lift">
      <div class="table-header">
        <div class="header-left">
          <mat-icon class="accent-blue">analytics</mat-icon>
          <h3 *ngIf="data.title" class="technical-text">{{ data.title }}</h3>
        </div>
        <div class="health-gauge">
          <div class="gauge-label technical-text">Fleet Health</div>
          <div class="gauge-circle">
            <svg viewBox="0 0 36 36" class="circular-chart nitrous">
              <path class="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="circle"
                stroke-dasharray="85, 100"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" class="percentage technical-text">85%</text>
            </svg>
          </div>
        </div>
      </div>

      <table mat-table [dataSource]="data.rows" class="full-width-table">
        <ng-container *ngFor="let header of data.headers; let i = index" [matColumnDef]="header">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> {{ header }} </th>
          <td mat-cell *matCellDef="let row"> 
            <span [class.accent-blue]="i === 0" [class.technical-text]="i === 0">
              {{ row[i] }} 
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="data.headers"></tr>
        <tr mat-row *matRowDef="let row; columns: data.headers;"></tr>
      </table>
      
      <div class="table-footer">
        <div class="system-status">
          <div class="pulse"></div>
          <span class="technical-text">System Online // Diagnostics Sync: Active</span>
        </div>
      </div>
    </div>
  `,
    styles: `
    .table-container {
      margin: 4rem 2rem;
      padding: 0;
      overflow: hidden;
    }
    .table-header {
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--glass-border);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .health-gauge {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .gauge-label {
      font-size: 0.8rem;
      opacity: 0.6;
    }
    .gauge-circle {
      width: 60px;
      height: 60px;
    }
    .circular-chart {
      display: block;
      margin: 10px auto;
      max-width: 100%;
      max-height: 250px;
    }
    .circle-bg {
      fill: none;
      stroke: var(--glass-border);
      stroke-width: 3.8;
    }
    .circle {
      fill: none;
      stroke-width: 2.8;
      stroke-linecap: round;
      animation: progress 1s ease-out forwards;
    }
    @keyframes progress {
      0% { stroke-dasharray: 0 100; }
    }
    .nitrous .circle {
      stroke: var(--nitrous-blue);
    }
    .percentage {
      fill: white;
      font-size: 0.5rem;
      text-anchor: middle;
    }
    .full-width-table {
      width: 100%;
      background: transparent !important;
    }
    .mat-mdc-header-cell {
      color: var(--nitrous-blue) !important;
      font-size: 0.9rem !important;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--glass-border) !important;
    }
    .mat-mdc-cell {
      color: var(--matte-silver) !important;
      border-bottom: 1px solid var(--glass-border) !important;
      padding: 1.5rem 0 !important;
    }
    .table-footer {
      padding: 1.5rem 2rem;
      background: rgba(0, 163, 255, 0.03);
    }
    .system-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.8rem;
      opacity: 0.5;
    }
    .pulse {
      width: 8px;
      height: 8px;
      background: var(--nitrous-blue);
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(0, 163, 255, 0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 163, 255, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 163, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 163, 255, 0); }
    }
  `
})
export class TableComponent {
    @Input() data!: {
        title?: string;
        headers: string[];
        rows: string[][];
    };
}
