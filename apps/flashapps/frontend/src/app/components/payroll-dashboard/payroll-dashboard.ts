import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PayrollService } from '../../services/payroll.service';
import { Payroll } from '../../models/wagtail';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="payroll-container glass-panel hover-lift">
      <div class="table-header">
        <div class="header-left">
          <mat-icon class="accent-blue">payments</mat-icon>
          <h3 class="technical-text">Payroll Processing Hub</h3>
        </div>
        <button mat-flat-button class="bg-nitrous technical-text">
          <mat-icon>account_balance_wallet</mat-icon> GENERATE_PAYSLIPS
        </button>
      </div>

      <table mat-table [dataSource]="records" class="full-width-table">
        <ng-container matColumnDef="mechanic">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> TECHNICIAN </th>
          <td mat-cell *matCellDef="let record"> <span class="accent-blue technical-text">{{ record.mechanic_display || 'Tech-ID-' + record.mechanic_id }}</span> </td>
        </ng-container>

        <ng-container matColumnDef="period">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> PERIOD </th>
          <td mat-cell *matCellDef="let record"> {{ record.month }}/{{ record.year }} </td>
        </ng-container>

        <ng-container matColumnDef="base">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> BASE_PAY </th>
          <td mat-cell *matCellDef="let record"> ₹{{ record.base_salary }} </td>
        </ng-container>

        <ng-container matColumnDef="bonus">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> BONUS_INC </th>
          <td mat-cell *matCellDef="let record" class="accent-blue"> +₹{{ record.total_bonus }} </td>
        </ng-container>

        <ng-container matColumnDef="net">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> NET_DISBURSED </th>
          <td mat-cell *matCellDef="let record"> <strong>₹{{ record.net_paid }}</strong> </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> STATUS </th>
          <td mat-cell *matCellDef="let record">
            <span [class.processed]="record.is_processed" class="status-tag">
              {{ record.is_processed ? 'PROCESSED' : 'PENDING' }}
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div class="table-footer">
        <div class="system-status">
          <div class="pulse"></div>
          <span class="technical-text">Banking Gateway: Online // Encryption: AES-256</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .payroll-container {
      margin: 2rem;
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
    .status-tag {
      font-family: 'Rajdhani', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border: 1px solid #ff9800;
      color: #ff9800;
      border-radius: 4px;
    }
    .status-tag.processed {
      border-color: var(--nitrous-blue);
      color: var(--nitrous-blue);
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
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 163, 255, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 163, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 163, 255, 0); }
    }
    .bg-nitrous {
      background-color: var(--nitrous-blue);
      color: white;
    }
  `
})
export class PayrollDashboardComponent implements OnInit {
  records: Payroll[] = [];
  displayedColumns: string[] = ['mechanic', 'period', 'base', 'bonus', 'net', 'status'];

  constructor(private payrollService: PayrollService) { }

  ngOnInit(): void {
    this.payrollService.getPayrollRecords().subscribe(data => {
      this.records = data.items;
    });
  }
}
