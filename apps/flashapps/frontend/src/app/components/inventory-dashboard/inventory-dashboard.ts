import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../services/inventory.service';
import { InventoryPart } from '../../models/wagtail';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="inventory-container glass-panel hover-lift">
      <div class="table-header">
        <div class="header-left">
          <mat-icon class="accent-blue">inventory_2</mat-icon>
          <h3 class="technical-text">Inventory Command Center</h3>
        </div>
        <button mat-flat-button class="bg-nitrous technical-text">
          <mat-icon>add</mat-icon> INWARD_STOCK
        </button>
      </div>

      <table mat-table [dataSource]="parts" class="full-width-table">
        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> SKU_ID </th>
          <td mat-cell *matCellDef="let part"> <span class="accent-blue technical-text">{{ part.sku }}</span> </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> PART_NAME </th>
          <td mat-cell *matCellDef="let part"> {{ part.name }} </td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> CATEGORY </th>
          <td mat-cell *matCellDef="let part"> {{ part.category }} </td>
        </ng-container>

        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> QTY_ON_HAND </th>
          <td mat-cell *matCellDef="let part"> 
            <span [class.low-stock]="part.stock_quantity <= part.reorder_level">
              {{ part.stock_quantity }} {{ part.unit_of_measure }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> UNIT_PRICE </th>
          <td mat-cell *matCellDef="let part"> ₹{{ part.unit_price }} </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="technical-text"> ACTIONS </th>
          <td mat-cell *matCellDef="let part">
            <button mat-icon-button class="accent-blue">
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div class="table-footer">
        <div class="system-status">
          <div class="pulse"></div>
          <span class="technical-text">Inventory Sync: Active // Warehouse Connection: Stable</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .inventory-container {
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
    .low-stock {
      color: #ff5252;
      font-weight: 700;
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
export class InventoryDashboardComponent implements OnInit {
  parts: InventoryPart[] = [];
  displayedColumns: string[] = ['sku', 'name', 'category', 'stock', 'price', 'actions'];

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.inventoryService.getParts().subscribe(data => {
      this.parts = data.items;
    });
  }
}
