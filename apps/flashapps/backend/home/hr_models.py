from django.db import models
from wagtail.snippets.models import register_snippet
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from django.conf import settings

class BiometricLog(models.Model):
    device_id = models.CharField(max_length=100)
    external_id = models.CharField(max_length=100, help_text="ID of the person in the biometric system")
    timestamp = models.DateTimeField()
    direction = models.CharField(max_length=10, choices=[('in', 'IN'), ('out', 'OUT')], default='in')
    raw_data = models.TextField(blank=True)

    def __str__(self):
        return f"{self.external_id} - {self.timestamp} ({self.direction})"

class SalaryStructure(models.Model):
    mechanic = models.OneToOneField('home.Mechanic', on_delete=models.CASCADE, related_name='salary_structure')
    base_pay = models.DecimalField(max_digits=10, decimal_places=2, default=15000.00)
    house_rent_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    conveyance_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    medical_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    provident_fund_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=200.00)

    panels = [
        MultiFieldPanel([
            FieldPanel('mechanic'),
            FieldPanel('base_pay'),
        ], heading="Base Compensation"),
        MultiFieldPanel([
            FieldPanel('house_rent_allowance'),
            FieldPanel('conveyance_allowance'),
            FieldPanel('medical_allowance'),
            FieldPanel('special_allowance'),
        ], heading="Allowances"),
        MultiFieldPanel([
            FieldPanel('provident_fund_deduction'),
            FieldPanel('professional_tax'),
        ], heading="Deductions"),
    ]

    @property
    def gross_salary(self):
        return (self.base_pay + self.house_rent_allowance + 
                self.conveyance_allowance + self.medical_allowance + 
                self.special_allowance)

    @property
    def net_salary(self):
        return self.gross_salary - self.provident_fund_deduction - self.professional_tax

    def __str__(self):
        return f"Salary Structure for {self.mechanic.name}"
