from django.db import models
from django.conf import settings
from wagtail.snippets.models import register_snippet
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField

class Shop(models.Model):
    THEME_CHOICES = [
        ('classic', 'Classic (Navy)'),
        ('emerald', 'Emerald Garden'),
        ('sunset', 'Sunset Glow'),
        ('cyberpunk', 'Cyberpunk Dark'),
        ('midnight', 'Midnight Pro'),
        ('azure', 'Business Azure'),
    ]
    
    shop_name = models.CharField(max_length=255, default="Flash Motors ERP")
    owner_name = models.CharField(max_length=255, default="Abhijeet Raut")
    
    owner_account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='shop_profile',
        help_text="Link this shop to a Wagtail User Account for isolated Admin access"
    )

    contact_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True, default="Lorem Ipsum Street, New Delhi")
    logo_url = models.URLField(blank=True, help_text="Direct link to shop logo")
    background_image_url = models.URLField(blank=True, help_text="Optional background splash image URL for the shop")
    
    theme_choice = models.CharField(max_length=20, choices=THEME_CHOICES, default='classic')
    primary_color = models.CharField(max_length=7, default="#1a237e", help_text="Hex code for primary color")
    secondary_color = models.CharField(max_length=7, default="#ef5350", help_text="Hex code for secondary color")
    currency_symbol = models.CharField(max_length=5, default="₹", help_text="Currency symbol (e.g. ₹, $)")
    
    # GST Settings
    gstin = models.CharField(max_length=15, default="07AAAAA0000A1Z5")
    
    panels = [
        MultiFieldPanel([
            FieldPanel('shop_name'),
            FieldPanel('owner_name'),
            FieldPanel('owner_account'),
            FieldPanel('logo_url'),
            FieldPanel('contact_number'),
            FieldPanel('address'),
        ], heading="General Information"),
        MultiFieldPanel([
            FieldPanel('theme_choice'),
            FieldPanel('primary_color'),
            FieldPanel('secondary_color'),
            FieldPanel('background_image_url'),
            FieldPanel('currency_symbol'),
        ], heading="Branding & Localization"),
        MultiFieldPanel([
            FieldPanel('gstin'),
        ], heading="Tax Information"),
    ]

    api_fields = [
        APIField('id'),
        APIField('shop_name'),
        APIField('owner_name'),
        APIField('logo_url'),
        APIField('contact_number'),
        APIField('address'),
        APIField('theme_choice'),
        APIField('primary_color'),
        APIField('secondary_color'),
        APIField('background_image_url'),
        APIField('currency_symbol'),
        APIField('gstin'),
    ]

    def __str__(self):
        return self.shop_name

    class Meta:
        verbose_name = "Shop Profile"
        verbose_name_plural = "Shop Profiles"
