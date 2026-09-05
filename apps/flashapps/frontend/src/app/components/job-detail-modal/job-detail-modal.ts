import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ERPService, ServiceJob } from '../../services/erp';

@Component({
    selector: 'app-job-detail-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule
    ],
    templateUrl: './job-detail-modal.html',
    styleUrls: ['./job-detail-modal.css']
})
export class JobDetailModalComponent {
    private erpService = inject(ERPService);
    private snackBar = inject(MatSnackBar);

    statusOptions = [
        { value: 'received', label: 'Received' },
        { value: 'inspection', label: 'Under Inspection' },
        { value: 'working', label: 'Work in Progress' },
        { value: 'testing', label: 'Final Testing' },
        { value: 'ready', label: 'Ready for Delivery' },
        { value: 'delivered', label: 'Delivered' }
    ];

    jobId: number;
    jobDisplay: string;
    vehicleName: string;
    
    // Mutable fields
    currentStatus: string;
    technicianNotes: string;

    isSaving = false;

    constructor(
        public dialogRef: MatDialogRef<JobDetailModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { job: ServiceJob }
    ) {
        this.jobId = data.job.id!;
        this.jobDisplay = data.job.job_id || 'Draft';
        this.vehicleName = data.job.vehicle_display || 'Unknown Vehicle';
        this.currentStatus = data.job.status;
        
        // Ensure technician notes default to empty string if undefined
        this.technicianNotes = data.job.technician_notes || data.job.issue_description || '';
    }

    saveChanges() {
        this.isSaving = true;
        this.erpService.updateJob(this.jobId, {
            status: this.currentStatus,
            technician_notes: this.technicianNotes
        }).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.snackBar.open('Job Details Saved Successfully!', 'Close', { duration: 3000 });
                this.dialogRef.close(true); // pass true to indicate refresh needed
            },
            error: (err) => {
                this.isSaving = false;
                this.snackBar.open('Error saving job details.', 'Close', { duration: 3000 });
            }
        });
    }

    close() {
        this.dialogRef.close(false);
    }
}
