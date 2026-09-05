from django.db import models
from wagtail.snippets.models import register_snippet
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from django.utils.translation import gettext_lazy as _
from wagtail.api import APIField
from wagtail.search import index

class Vehicle(index.Indexed, models.Model):
    VEHICLE_TYPES = [
        ('bike', 'Bike'),
        ('car', 'Car'),
    ]
    
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPES, default='bike')
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    license_plate = models.CharField(max_length=20, unique=True)
    vin = models.CharField(max_length=50, blank=True, verbose_name="VIN/Chassis Number")
    
    owner_name = models.CharField(max_length=200)
    owner_phone = models.CharField(max_length=20, blank=True)
    owner_email = models.EmailField(blank=True)

    panels = [
        MultiFieldPanel([
            FieldPanel('vehicle_type'),
            FieldPanel('make'),
            FieldPanel('model'),
            FieldPanel('year'),
            FieldPanel('license_plate'),
            FieldPanel('vin'),
        ], heading="Vehicle Information"),
        MultiFieldPanel([
            FieldPanel('owner_name'),
            FieldPanel('owner_phone'),
            FieldPanel('owner_email'),
        ], heading="Owner Information"),
    ]

    api_fields = [
        APIField('id'),
        APIField('vehicle_type'),
        APIField('make'),
        APIField('model'),
        APIField('year'),
        APIField('license_plate'),
        APIField('owner_name'),
        APIField('display_name'),
    ]

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

    class Meta:
        verbose_name = "Vehicle"
        verbose_name_plural = "Vehicles"

    search_fields = [
        index.SearchField('license_plate'),
        index.SearchField('owner_name'),
        index.SearchField('make'),
    ]

    @property
    def display_name(self):
        return f"{self.make} {self.model} ({self.license_plate})"

class Mechanic(index.Indexed, models.Model):
    name = models.CharField(max_length=200)
    specialty = models.CharField(max_length=100, help_text="e.g. Engine, Electronics, Bodywork")
    is_active = models.BooleanField(default=True)
    
    panels = [
        FieldPanel('name'),
        FieldPanel('specialty'),
        FieldPanel('is_active'),
    ]

    api_fields = [
        APIField('id'),
        APIField('name'),
        APIField('specialty'),
        APIField('display_name'),
    ]

    def __str__(self):
        return f"{self.name} - {self.specialty}"

    search_fields = [
        index.SearchField('name'),
        index.SearchField('specialty'),
    ]

    @property
    def display_name(self):
        return f"{self.name} ({self.specialty})"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'On Leave'),
    ]
    mechanic = models.ForeignKey(Mechanic, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField(auto_now_add=True)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')

    panels = [
        FieldPanel('mechanic'),
        FieldPanel('status'),
        FieldPanel('check_in'),
        FieldPanel('check_out'),
    ]

    api_fields = [
        APIField('id'),
        APIField('mechanic_id'),
        APIField('date'),
        APIField('status'),
        APIField('check_in'),
        APIField('check_out'),
    ]

    class Meta:
        unique_together = ('mechanic', 'date')
        verbose_name_plural = "Attendance Records"

class BonusRule(models.Model):
    rule_name = models.CharField(max_length=100)
    amount_per_job = models.DecimalField(max_digits=10, decimal_places=2)
    specialty_target = models.CharField(max_length=100, blank=True, help_text="Apply only to this specialty")

    panels = [
        FieldPanel('rule_name'),
        FieldPanel('amount_per_job'),
        FieldPanel('specialty_target'),
    ]

    def __str__(self):
        return f"{self.rule_name} (₹{self.amount_per_job}/job)"

class Payroll(models.Model):
    mechanic = models.ForeignKey(Mechanic, on_delete=models.CASCADE, related_name='payroll')
    month = models.IntegerField(default=3)
    year = models.IntegerField(default=2026)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=20000.00)
    total_bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payment_date = models.DateField(null=True, blank=True)
    is_processed = models.BooleanField(default=False)

    panels = [
        FieldPanel('mechanic'),
        FieldPanel('month'),
        FieldPanel('year'),
        FieldPanel('base_salary'),
        FieldPanel('total_bonus'),
        FieldPanel('deductions'),
        FieldPanel('net_paid'),
        FieldPanel('payment_date'),
        FieldPanel('is_processed'),
    ]

    api_fields = [
        APIField('id'),
        APIField('mechanic_id'),
        APIField('month'),
        APIField('year'),
        APIField('base_salary'),
        APIField('total_bonus'),
        APIField('net_paid'),
        APIField('payment_date'),
        APIField('is_processed'),
    ]

class InspectionBucket(models.Model):
    name = models.CharField(max_length=100, help_text="e.g. BRAKES, ENGINE OIL, TYRES")
    description = models.TextField(blank=True)
    
    panels = [
        FieldPanel('name'),
        FieldPanel('description'),
    ]

    def __str__(self):
        return self.name

class ServiceJob(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('inspection', 'Under Inspection'),
        ('working', 'Work in Progress'),
        ('testing', 'Final Testing'),
        ('ready', 'Ready for Delivery'),
        ('delivered', 'Delivered'),
    ]
    
    job_id = models.CharField(max_length=20, unique=True, editable=False)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='service_jobs')
    assigned_mechanic = models.ForeignKey(Mechanic, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    
    issue_description = models.TextField(verbose_name="Customer Reported Issue")
    technician_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    panels = [
        FieldPanel('vehicle'),
        FieldPanel('assigned_mechanic'),
        FieldPanel('status'),
        FieldPanel('issue_description'),
        FieldPanel('technician_notes'),
    ]

    api_fields = [
        APIField('id'),
        APIField('job_id'),
        APIField('status'),
        APIField('issue_description'),
        APIField('created_at'),
        APIField('vehicle_display'),
        APIField('assigned_mechanic_display'),
    ]

    def save(self, *args, **kwargs):
        if not self.job_id:
            import uuid
            self.job_id = f"JOB-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.job_id} - {self.vehicle.license_plate} ({self.status})"

    @property
    def vehicle_display(self):
        return self.vehicle.display_name

    @property
    def assigned_mechanic_display(self):
        return self.assigned_mechanic.display_name if self.assigned_mechanic else "Unassigned"

class Invoice(models.Model):
    invoice_number = models.CharField(max_length=20, unique=True, editable=False)
    service_job = models.OneToOneField(ServiceJob, on_delete=models.CASCADE, related_name='invoice')
    
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    parts_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_type = models.CharField(max_length=20, choices=[('fixed', 'Fixed'), ('percent', 'Percent')], default='fixed')
    
    # GST Fields
    hsn_sac_code = models.CharField(max_length=20, default="9987")
    cgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=9.00)
    sgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=9.00)
    igst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    customer_gstin = models.CharField(max_length=15, blank=True)
    service_center_gstin = models.CharField(max_length=15, default="07AAAAA0000A1Z5")
    
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        base = self.labor_cost + self.parts_cost
        if self.discount_type == 'percent':
            return base * (1 - self.discount_amount / 100)
        return max(0, base - self.discount_amount)

    @property
    def cgst_amount(self):
        return self.subtotal * (self.cgst_rate / 100)

    @property
    def sgst_amount(self):
        return self.subtotal * (self.sgst_rate / 100)

    @property
    def igst_amount(self):
        return self.subtotal * (self.igst_rate / 100)

    @property
    def total_amount(self):
        return self.subtotal + self.cgst_amount + self.sgst_amount + self.igst_amount

    panels = [
        FieldPanel('service_job'),
        FieldPanel('labor_cost'),
        FieldPanel('parts_cost'),
        MultiFieldPanel([
            FieldPanel('discount_amount'),
            FieldPanel('discount_type'),
        ], heading="Discounts & Offers"),
        MultiFieldPanel([
            FieldPanel('hsn_sac_code'),
            FieldPanel('cgst_rate'),
            FieldPanel('sgst_rate'),
            FieldPanel('igst_rate'),
        ], heading="GST Configuration"),
        MultiFieldPanel([
            FieldPanel('customer_gstin'),
            FieldPanel('service_center_gstin'),
        ], heading="Tax Identities"),
        FieldPanel('is_paid'),
    ]

    api_fields = [
        APIField('id'),
        APIField('invoice_number'),
        APIField('labor_cost'),
        APIField('parts_cost'),
        APIField('discount_amount'),
        APIField('discount_type'),
        APIField('hsn_sac_code'),
        APIField('cgst_rate'),
        APIField('sgst_rate'),
        APIField('igst_rate'),
        APIField('cgst_amount'),
        APIField('sgst_amount'),
        APIField('igst_amount'),
        APIField('subtotal'),
        APIField('total_amount'),
        APIField('customer_gstin'),
        APIField('service_center_gstin'),
        APIField('is_paid'),
        APIField('service_job_display'),
    ]

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            import datetime
            now = datetime.datetime.now()
            self.invoice_number = f"INV-{now.strftime('%Y%m%d')}-{self.service_job.job_id[-4:]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} (Job: {self.service_job.job_id})"

    @property
    def service_job_display(self):
        return f"{self.service_job.job_id} ({self.service_job.vehicle.make})"

class SeasonalOffer(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    discount_code = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    valid_until = models.DateField(null=True, blank=True)
    
    image_url = models.URLField(blank=True, help_text="Optional banner image URL")

    panels = [
        FieldPanel('title'),
        FieldPanel('description'),
        FieldPanel('discount_code'),
        FieldPanel('is_active'),
        FieldPanel('valid_until'),
        FieldPanel('image_url'),
    ]

    api_fields = [
        APIField('id'),
        APIField('title'),
        APIField('description'),
        APIField('discount_code'),
        APIField('is_active'),
        APIField('valid_until'),
        APIField('image_url'),
    ]

    def __str__(self):
        return self.title
