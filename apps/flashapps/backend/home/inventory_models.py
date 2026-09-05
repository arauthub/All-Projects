from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField

class InventoryPart(models.Model):
    CATEGORY_CHOICES = [
        ('engine', 'Engine Parts'),
        ('electrical', 'Electrical'),
        ('body', 'Body & Exterior'),
        ('brakes', 'Braking System'),
        ('suspension', 'Suspension'),
        ('tyres', 'Tyres & Wheels'),
        ('consumables', 'Consumables (Oil, Coolant)'),
        ('accessories', 'Accessories'),
    ]

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, unique=True, verbose_name="SKU/Part Number")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='engine')
    description = models.TextField(blank=True)
    
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Selling price per unit")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Purchase price per unit")
    
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    
    unit_of_measure = models.CharField(max_length=20, default="pcs", help_text="e.g. pcs, ltrs, sets")

    panels = [
        MultiFieldPanel([
            FieldPanel('name'),
            FieldPanel('sku'),
            FieldPanel('category'),
            FieldPanel('description'),
        ], heading="Part Details"),
        MultiFieldPanel([
            FieldPanel('unit_price'),
            FieldPanel('cost_price'),
            FieldPanel('unit_of_measure'),
        ], heading="Pricing & Units"),
        MultiFieldPanel([
            FieldPanel('stock_quantity'),
            FieldPanel('reorder_level'),
        ], heading="Stock Levels"),
    ]

    api_fields = [
        APIField('id'),
        APIField('name'),
        APIField('sku'),
        APIField('category'),
        APIField('unit_price'),
        APIField('stock_quantity'),
        APIField('reorder_level'),
        APIField('unit_of_measure'),
    ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    class Meta:
        verbose_name = "Inventory Part"
        verbose_name_plural = "Inventory Parts"

class StockTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase/Inward'),
        ('consumption', 'Consumption/Used in Job'),
        ('adjustment', 'Stock Adjustment'),
        ('return', 'Return to Supplier'),
    ]
    
    part = models.ForeignKey(InventoryPart, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    # Optional link to service job if consumption
    service_job = models.ForeignKey('home.ServiceJob', on_delete=models.SET_NULL, null=True, blank=True, related_name='part_consumptions')

    def save(self, *args, **kwargs):
        # Update stock quantity on InventoryPart
        if self.transaction_type in ['purchase', 'adjustment']:
            self.part.stock_quantity += self.quantity
        elif self.transaction_type in ['consumption', 'return']:
            self.part.stock_quantity -= self.quantity
        
        self.part.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type} - {self.part.name} ({self.quantity})"
