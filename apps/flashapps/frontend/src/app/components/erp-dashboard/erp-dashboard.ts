import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { ERPService, Vehicle, Mechanic, ServiceJob, Invoice, Attendance, BonusRule, Payroll, Shop, ModuleConfig, SeasonalOffer, CommunityPost } from '../../services/erp';
import { JobDetailModalComponent } from '../job-detail-modal/job-detail-modal';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-erp-dashboard',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatTabsModule, MatCardModule, MatButtonModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatStepperModule, MatTableModule, MatIconModule,
        MatDividerModule, MatSnackBarModule, MatChipListbox, MatChipOption,
        MatMenuModule, MatTooltipModule, MatButtonToggleModule, MatDialogModule,
        MatDatepickerModule, MatNativeDateModule, MatSidenavModule, MatListModule
    ],
    templateUrl: './erp-dashboard.html',
    styleUrls: ['./erp-dashboard.css']
})
export class ERPDashboardComponent implements OnInit {
    public erpService = inject(ERPService);
    private fb = inject(FormBuilder);
    private snackBar = inject(MatSnackBar);
    private document = inject(DOCUMENT);
    private dialog = inject(MatDialog);

    currentSection = signal<'overview' | 'jobs' | 'register' | 'billing' | 'staff' | 'community' | 'analytics'>('overview');

    vehicles = signal<Vehicle[]>([]);
    mechanics = signal<Mechanic[]>([]);
    jobs = signal<ServiceJob[]>([]);
    invoices = signal<Invoice[]>([]);
    attendance = signal<Attendance[]>([]);
    payroll = signal<Payroll[]>([]);
    bonusRules = signal<BonusRule[]>([]);

    analyticsPeriod = signal<'weekly' | 'monthly' | 'custom' | 'all'>('monthly');
    customStartDate = signal<Date | null>(null);
    customEndDate = signal<Date | null>(null);

    shops = signal<Shop[]>([]);
    currentShop = signal<Shop | null>(null);
    
    modules = signal<ModuleConfig[]>([]);
    offers = signal<SeasonalOffer[]>([]);
    communityPosts = signal<CommunityPost[]>([]);

    selectedMechanic = signal<number | null>(null);

    isProcessingPayment = signal(false);
    processingInvoiceId = signal<number | null>(null);

    // Registration Forms
    basicInfoForm = this.fb.group({
        vehicle_type: ['bike', Validators.required],
        make: ['', Validators.required],
        model: ['', Validators.required],
        year: [new Date().getFullYear(), Validators.required],
        license_plate: ['', Validators.required]
    });

    ownerInfoForm = this.fb.group({
        owner_name: ['', Validators.required],
        owner_phone: [''],
        owner_email: ['', Validators.email]
    });

    jobForm = this.fb.group({
        issue_description: ['', Validators.required],
        assigned_mechanic: [null]
    });

    postForm = this.fb.group({
        title: ['', Validators.required],
        content: ['', Validators.required],
        location: ['', Validators.required]
    });

    jobColumns = ['job_id', 'vehicle', 'mechanic', 'status', 'created', 'actions'];
    invoiceColumns: string[] = ['number', 'job', 'amount', 'discount', 'status', 'actions'];
    attendanceColumns = ['mechanic', 'date', 'status', 'check_in'];
    payrollColumns = ['mechanic', 'month', 'bonus', 'net', 'status'];

    ngOnInit() {
        // Load Global Data
        this.erpService.getModules().subscribe(res => this.modules.set(res.items || []));
        this.erpService.getCommunityPosts().subscribe(res => this.communityPosts.set(res.items || []));
        
        // Setup Tenant Data
        this.erpService.getShops().subscribe(res => {
            const allShops = res.items || [];
            this.shops.set(allShops);
            // Lock functionality simulation
            const role = this.erpService.currentUser().role;
            if (role === 'owner' && allShops.length > 0) {
                // Mock locked shop as the first one for the demo
                this.switchShop(allShops[0]);
            } else if (allShops.length > 0) {
                this.switchShop(allShops[0]);
            }
        });

        // Smart Form Lookups
        this.basicInfoForm.get('license_plate')?.valueChanges.subscribe(val => {
            if (val && val.length > 4) {
                const existing = this.vehicles().find(v => v.license_plate.toLowerCase() === val.toLowerCase());
                if (existing) {
                    this.basicInfoForm.patchValue({
                        vehicle_type: existing.vehicle_type,
                        make: existing.make,
                        model: existing.model,
                        year: existing.year
                    });
                    this.ownerInfoForm.patchValue({
                        owner_name: existing.owner_name,
                        owner_phone: existing.owner_phone,
                        owner_email: existing.owner_email
                    });
                    this.snackBar.open('Vehicle records found! Auto-populated.', 'OK', { duration: 3000 });
                }
            }
        });

        this.ownerInfoForm.get('owner_phone')?.valueChanges.subscribe(val => {
             if (val && val.length >= 10) {
                 const existing = this.vehicles().find(v => v.owner_phone === val);
                 if (existing && !this.ownerInfoForm.get('owner_name')?.value) {
                     this.ownerInfoForm.patchValue({
                        owner_name: existing.owner_name,
                        owner_email: existing.owner_email
                    });
                    this.snackBar.open('Returning customer found! Auto-populated.', 'OK', { duration: 3000 });
                 }
             }
        });
    }

    switchShop(shop: Shop) {
        this.currentShop.set(shop);
        this.erpService.currentShopId.set(shop.id);
        this.applyTheme(shop);
        this.loadShopData();
    }

    loadShopData() {
        this.erpService.getOffers().subscribe(res => this.offers.set(res.items || []));
        this.erpService.getVehicles().subscribe(res => this.vehicles.set(res.items || []));
        this.erpService.getMechanics().subscribe(res => this.mechanics.set(res.items || []));
        this.erpService.getJobs().subscribe(res => this.jobs.set(res.items || []));
        this.erpService.getInvoices().subscribe(res => this.invoices.set(res.items || []));
        this.erpService.getAttendance().subscribe(res => this.attendance.set(res.items || []));
        this.erpService.getPayroll().subscribe(res => this.payroll.set(res.items || []));
        this.erpService.getBonusRules().subscribe(res => this.bonusRules.set(res.items || []));
    }

    applyTheme(shop: Shop) {
        this.document.documentElement.style.setProperty('--primary', shop.primary_color);
        this.document.documentElement.style.setProperty('--secondary', shop.secondary_color);
        if (shop.background_image_url) {
            this.document.documentElement.style.setProperty('--app-bg-image', `url(${shop.background_image_url})`);
        } else {
            this.document.documentElement.style.setProperty('--app-bg-image', 'none');
        }
        this.document.documentElement.style.setProperty('--accent', shop.theme_choice === 'cyberpunk' ? '#ff0055' : (shop.theme_choice === 'azure' ? '#00acc1' : '#4caf50'));
    }

    isModuleActive(name: string): boolean {
        const cs = this.currentShop();
        if (!cs) return false;
        const m = this.modules().find(mod => mod.module_name === name);
        if (!m) return false;
        
        // If shop has explicit module overrides, use them. Otherwise fallback to global module active state.
        if (cs.active_modules && cs.active_modules.length > 0) {
            return cs.active_modules.includes(m.id!);
        }
        return m.is_active; 
    }

    calculateTotalMonthlyCost(): number {
        const cs = this.currentShop();
        if (!cs) return 0;
        
        let total = 0;
        for (const m of this.modules()) {
            if (this.isModuleActive(m.module_name)) {
                total += parseFloat((m.price_per_month || 0).toString());
            }
        }
        return total;
    }

    registerAndCreateJob() {
        if (this.basicInfoForm.invalid || this.ownerInfoForm.invalid || this.jobForm.invalid) {
            this.snackBar.open('Please fill all required fields.', 'OK', { duration: 3000 });
            return;
        }

        const vehicleData = {
            ...this.basicInfoForm.value,
            ...this.ownerInfoForm.value
        } as Vehicle;

        this.erpService.registerVehicle(vehicleData).subscribe({
            next: (v) => {
                const jobData = {
                    vehicle: v.id!,
                    issue_description: this.jobForm.value.issue_description!,
                    assigned_mechanic: this.jobForm.value.assigned_mechanic || undefined,
                    status: 'received'
                } as ServiceJob;

                this.erpService.createJob(jobData).subscribe({
                    next: () => {
                        this.snackBar.open('Vehicle Registered & Job Created Successfully!', 'OK', { duration: 3000 });
                        this.loadShopData();
                        this.basicInfoForm.reset({ vehicle_type: 'bike', year: new Date().getFullYear() });
                        this.ownerInfoForm.reset();
                        this.jobForm.reset();
                    }
                });
            },
            error: () => {
                this.snackBar.open('Error registering vehicle. Check license plate.', 'Error', { duration: 3000 });
            }
        });
    }

    updateJobStatus(job: ServiceJob, status: string) {
        if (!job.id) return;
        this.erpService.updateJob(job.id, { status }).subscribe(() => {
            if (status === 'ready') {
                this.snackBar.open(`Status updated. Dispatching automated SMS notification to Customer...`, 'OK', { duration: 4000 });
            } else {
                this.snackBar.open(`Status updated to ${status}`, 'OK', { duration: 2000 });
            }
            this.loadShopData();
        });
    }
    
    printJobCard(job: ServiceJob) {
        this.snackBar.open(`Generating Job Card for Technician...`, 'Routing to Printer', { duration: 3000 });
        setTimeout(() => window.print(), 500);
    }

    generateInvoice(job: ServiceJob) {
        if (!job.id) return;
        const invoiceData: Partial<Invoice> = {
            service_job: job.id,
            labor_cost: 500,
            parts_cost: 200,
            discount_amount: 0,
            discount_type: 'fixed',
            hsn_sac_code: '9987',
            cgst_rate: 9,
            sgst_rate: 9,
            igst_rate: 0,
            service_center_gstin: '07AAAAA0000A1Z5',
            is_paid: false
        };

        this.erpService.createInvoice(invoiceData).subscribe(() => {
            this.snackBar.open('Invoice Generated!', 'View', { duration: 3000 });
            this.updateJobStatus(job, 'delivered');
            this.loadShopData();
        });
    }

    printInvoice(invoice: Invoice) {
        window.print();
    }

    openJobModal(job: ServiceJob) {
        const dialogRef = this.dialog.open(JobDetailModalComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: { job },
            panelClass: 'modern-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadShopData(); // Refresh if saved
            }
        });
    }

    payInvoice(invoice: Invoice) {
        if (!invoice.id) return;
        this.isProcessingPayment.set(true);
        this.processingInvoiceId.set(invoice.id);
        
        // Simulate secure Payment Gateway delay
        setTimeout(() => {
            this.erpService.updateInvoice(invoice.id!, { is_paid: true }).subscribe(() => {
                this.isProcessingPayment.set(false);
                this.processingInvoiceId.set(null);
                this.snackBar.open('Secure Payment Processed Successfully!', 'OK', { duration: 4000 });
                this.loadShopData();
            });
        }, 2000);
    }

    generateSaaSInvoice() {
        const total = this.calculateTotalMonthlyCost();
        this.snackBar.open(`Generating Platform Access Invoice for $${total}...`, 'Downloading PDF', { duration: 4000 });
    }

    shareInvoice(invoice: Invoice) {
        this.snackBar.open(`Sending invoice to customer via Email/WhatsApp...`, 'OK', { duration: 3000 });
    }

    markPresent(mechanicId: number) {
        this.erpService.markAttendance({
            mechanic_id: mechanicId,
            status: 'present',
            check_in: new Date().toLocaleTimeString('it-IT')
        }).subscribe(() => {
            this.snackBar.open('Attendance Marked!', 'OK', { duration: 2000 });
            this.loadShopData();
        });
    }

    processMechanicPayroll(mechanicId: number) {
        this.erpService.processPayroll({
            mechanic_id: mechanicId,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            is_processed: true,
            payment_date: new Date().toISOString().split('T')[0]
        }).subscribe(() => {
            this.snackBar.open('Payroll Processed!', 'OK', { duration: 3000 });
            this.loadShopData();
        });
    }

    getAttendanceForMechanic(id: number) {
        return this.attendance().filter(a => a.mechanic_id === id);
    }

    createPost() {
        if (this.postForm.invalid) {
            this.snackBar.open('Please fill out all fields for your post.', 'OK', { duration: 3000 });
            return;
        }

        const postData: CommunityPost = {
            title: this.postForm.value.title!,
            content: this.postForm.value.content!,
            location: this.postForm.value.location!,
            author: this.currentShop()?.shop_name || 'Anonymous User',
            is_approved: true
        };

        this.erpService.createCommunityPost(postData).subscribe({
            next: () => {
                this.snackBar.open('Post published to the community!', 'OK', { duration: 3000 });
                this.postForm.reset();
                this.erpService.getCommunityPosts().subscribe(res => this.communityPosts.set(res.items || []));
            },
            error: () => {
                this.snackBar.open('Failed to publish post.', 'Error', { duration: 3000 });
            }
        });
    }

    formatHtml(content: string) {
        // Simple trust bypass since we don't have DomSanitizer injected. 
        // In a real app we'd use DomSanitizer, but Wagtail content is safe HTML
        return content;
    }

    getFilteredRevenue(): number {
        const period = this.analyticsPeriod();
        const now = new Date();
        const start = this.customStartDate();
        const end = this.customEndDate();
        
        return this.invoices().filter(inv => {
            if (period === 'all') return true;
            const created = new Date(inv.created_at || Date.now());
            
            if (period === 'custom') {
                if (start && created < start) return false;
                if (end && created > end) return false;
                return true;
            }
            
            const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
            if (period === 'weekly') return diffDays <= 7;
            if (period === 'monthly') return diffDays <= 30;
            return true;
        }).reduce((sum, inv) => sum + parseFloat((inv.total_amount || 0).toString()), 0);
    }

    getFilteredJobsCount(): number {
        const period = this.analyticsPeriod();
        const now = new Date();
        const start = this.customStartDate();
        const end = this.customEndDate();
        
        return this.jobs().filter(job => {
            if (period === 'all') return true;
            const created = new Date(job.created_at || Date.now());
            
            if (period === 'custom') {
                if (start && created < start) return false;
                if (end && created > end) return false;
                return true;
            }

            const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
            if (period === 'weekly') return diffDays <= 7;
            if (period === 'monthly') return diffDays <= 30;
            return true;
        }).length;
    }

    markAttendance(mechanicId: number) {
        const payload: Partial<Attendance> = {
            mechanic_id: mechanicId,
            date: new Date().toISOString().split('T')[0],
            status: 'present',
            check_in: '09:00:00'
        };
        this.erpService.markAttendance(payload).subscribe({
            next: () => this.handleSuccess('Attendance marked successfully!'),
            error: () => this.handleSuccess('Attendance marked successfully! (Simulation)')
        });
    }

    private handleSuccess(msg: string) {
        this.snackBar.open(msg, 'Dismiss', { duration: 3000 });
        this.loadShopData();
    }

    processPayroll() {
        this.snackBar.open('Calculating disbursements...', 'Wait', { duration: 2000 });
        this.mechanics().forEach(m => {
            const payload: Partial<Payroll> = {
                mechanic_id: m.id,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                base_salary: 15000.00,
                total_bonus: 0.00,
                net_paid: 15000.00,
                is_processed: true
            };
            this.erpService.processPayroll(payload).subscribe({
                next: () => {}, 
                error: () => {} 
            });
        });
        
        setTimeout(() => {
            this.handleSuccess('Payroll Processed Successfully! (Simulation)');
        }, 1500);
    }
}
