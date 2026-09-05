import { Routes } from '@angular/router';
import { ModularPageComponent } from './components/modular-page/modular-page';
import { ShowcaseComponent } from './components/showcase/showcase';
import { ERPDashboardComponent } from './components/erp-dashboard/erp-dashboard';
import { InventoryDashboardComponent } from './components/inventory-dashboard/inventory-dashboard';
import { PayrollDashboardComponent } from './components/payroll-dashboard/payroll-dashboard';

export const routes: Routes = [
    { path: 'pages/:id', component: ModularPageComponent },
    { path: 'showcase', component: ShowcaseComponent },
    { path: 'erp', component: ERPDashboardComponent },
    { path: 'inventory', component: InventoryDashboardComponent },
    { path: 'payroll', component: PayrollDashboardComponent },
    { path: '', redirectTo: 'erp', pathMatch: 'full' }
];
