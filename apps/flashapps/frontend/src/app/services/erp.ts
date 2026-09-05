import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Vehicle {
    id?: number;
    vehicle_type: 'bike' | 'car';
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vin?: string;
    owner_name: string;
    owner_phone?: string;
    owner_email?: string;
}

export type UserRole = 'admin' | 'owner' | 'sales';

export interface Shop {
    id: number;
    shop_name: string;
    owner_name: string;
    contact_number: string;
    address: string;
    logo_url?: string;
    theme_choice: string;
    primary_color: string;
    secondary_color: string;
    background_image_url?: string;
    gstin: string;
    currency_symbol?: string;
    active_modules?: number[];
}

export interface ModuleConfig {
    id?: number;
    module_name: string;
    is_active: boolean;
    description?: string;
    price_per_month?: number;
}

export interface SeasonalOffer {
    id?: number;
    title: string;
    description: string;
    discount_code?: string;
    is_active: boolean;
    valid_until?: string;
    image_url?: string;
}

export interface Mechanic {
    id?: number;
    name: string;
    specialty: string;
    is_active: boolean;
    display_name?: string;
}

export interface Attendance {
    id?: number;
    mechanic_id: number;
    date: string;
    check_in?: string;
    check_out?: string;
    status: 'present' | 'absent' | 'half_day' | 'leave';
}

export interface BonusRule {
    id?: number;
    rule_name: string;
    amount_per_job: number;
    specialty_target?: string;
}

export interface Payroll {
    id?: number;
    mechanic_id: number;
    month: number;
    year: number;
    base_salary: number;
    total_bonus: number;
    net_paid: number;
    payment_date?: string;
    is_processed: boolean;
}

export interface ServiceJob {
    id?: number;
    job_id?: string;
    vehicle: number | Vehicle;
    assigned_mechanic?: number | Mechanic;
    status: string;
    issue_description: string;
    technician_notes?: string;
    created_at?: string;
    updated_at?: string;
    vehicle_display?: string;
    assigned_mechanic_display?: string;
}

export interface Invoice {
    id?: number;
    invoice_number?: string;
    service_job: number;
    labor_cost: number;
    parts_cost: number;

    discount_amount: number;
    discount_type: 'fixed' | 'percent';

    hsn_sac_code: string;
    cgst_rate: number;
    sgst_rate: number;
    igst_rate: number;

    cgst_amount?: number;
    sgst_amount?: number;
    igst_amount?: number;
    subtotal?: number;
    total_amount?: number;

    customer_gstin?: string;
    service_center_gstin?: string;
    is_paid: boolean;
    created_at?: string;
    service_job_display?: string;
}

export interface CommunityPost {
    id?: number;
    title: string;
    author: string;
    location: string;
    content: string;
    is_approved?: boolean;
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ERPService {
    private http = inject(HttpClient);
    private apiBase = 'http://localhost:8000/api/v2';

    currentShopId = signal<number | null>(null);

    private get urlParams() {
        const id = this.currentShopId();
        return id ? `&shop=${id}` : '';
    }

    getShops(): Observable<any> {
        return this.http.get(`${this.apiBase}/shops/?fields=*`);
    }

    getVehicles(): Observable<any> {
        return this.http.get(`${this.apiBase}/vehicles/?fields=*${this.urlParams}`);
    }

    registerVehicle(vehicle: Vehicle): Observable<Vehicle> {
        return this.http.post<Vehicle>(`${this.apiBase}/vehicles/`, { ...vehicle, shop: this.currentShopId() });
    }

    getMechanics(): Observable<any> {
        return this.http.get(`${this.apiBase}/mechanics/?fields=*${this.urlParams}`);
    }

    getJobs(): Observable<any> {
        return this.http.get(`${this.apiBase}/jobs/?fields=*${this.urlParams}`);
    }

    createJob(job: ServiceJob): Observable<ServiceJob> {
        return this.http.post<ServiceJob>(`${this.apiBase}/jobs/`, { ...job, shop: this.currentShopId() });
    }

    updateJob(id: number, job: Partial<ServiceJob>): Observable<any> {
        return this.http.patch(`${this.apiBase}/jobs/${id}/`, job);
    }

    getInvoices(): Observable<any> {
        return this.http.get(`${this.apiBase}/invoices/?fields=*${this.urlParams}`);
    }

    createInvoice(invoice: Partial<Invoice>): Observable<Invoice> {
        return this.http.post<Invoice>(`${this.apiBase}/invoices/`, { ...invoice, shop: this.currentShopId() });
    }

    updateInvoice(id: number, data: Partial<Invoice>): Observable<any> {
        return this.http.patch(`${this.apiBase}/invoices/${id}/`, data);
    }

    getAttendance(): Observable<any> {
        return this.http.get(`${this.apiBase}/attendance/?fields=*${this.urlParams}`);
    }

    markAttendance(att: Partial<Attendance>): Observable<Attendance> {
        return this.http.post<Attendance>(`${this.apiBase}/attendance/`, { ...att, shop: this.currentShopId() });
    }

    getBonusRules(): Observable<any> {
        return this.http.get(`${this.apiBase}/bonus_rules/?fields=*${this.urlParams}`);
    }

    getPayroll(): Observable<any> {
        return this.http.get(`${this.apiBase}/payroll/?fields=*${this.urlParams}`);
    }

    processPayroll(payroll: Partial<Payroll>): Observable<Payroll> {
        return this.http.post<Payroll>(`${this.apiBase}/payroll/`, { ...payroll, shop: this.currentShopId() });
    }

    getInspectionBuckets(): Observable<any> {
        return this.http.get(`${this.apiBase}/inspection_buckets/?fields=*${this.urlParams}`);
    }

    getModules(): Observable<any> {
        return this.http.get(`${this.apiBase}/modules/?fields=*`);
    }

    getOffers(): Observable<any> {
        return this.http.get(`${this.apiBase}/offers/?fields=*${this.urlParams}`);
    }

    getCommunityPosts(): Observable<any> {
        return this.http.get(`${this.apiBase}/community-posts/?fields=*`);
    }

    createCommunityPost(post: CommunityPost): Observable<CommunityPost> {
        // Community posts are global
        return this.http.post<CommunityPost>(`${this.apiBase}/community-posts/`, post);
    }

    // Role Simulation
    currentUser = signal<{ name: string, role: UserRole }>({ name: 'Admin User', role: 'owner' });

    setRole(role: UserRole) {
        this.currentUser.set({
            name: role === 'owner' ? 'Owner User' : 'Sales User',
            role: role
        });
    }
}
