import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flashapps_backend.settings.dev')
django.setup()

from home.models import Shop, ModuleConfig, SeasonalOffer, Mechanic

def seed():
    # 1. Shop Settings
    shop, created = Shop.objects.get_or_create(id=1)
    shop.shop_name = "FLASH MOTORS ERP (Lorem Ipsum Edition)"
    shop.owner_name = "Abhijeet Raut (Owner)"
    shop.address = "123 Lorem Ipsum Way, Dolor Sit Amet, New Delhi 110001"
    shop.contact_number = "+91 99999 88888"
    shop.theme_choice = 'cyberpunk'
    shop.primary_color = "#00ff9f"  # Neon Green
    shop.secondary_color = "#ff0055" # Cyber Pink
    shop.save()
    print("Shop settings seeded.")

    # Second Shop branch
    shop2, created = Shop.objects.get_or_create(id=2)
    shop2.shop_name = "FLASH MOTORS ERP (South Branch)"
    shop2.owner_name = "Abhijeet Raut"
    shop2.address = "456 South Avenue, New Delhi"
    shop2.contact_number = "+91 99999 77777"
    shop2.theme_choice = 'emerald'
    shop2.primary_color = "#2e7d32" 
    shop2.secondary_color = "#ffca28"
    shop2.save()

    # 2. Module Configs
    modules = [
        ("Payroll", True, "Manage mechanic attendance and payments.", 250.00),
        ("Inspections", True, "Detailed vehicle checkups.", 150.00),
        ("Inventory", False, "Track spare parts and consumables.", 0.00),
        ("Billing", True, "Generate & share customer invoices.", 100.00),
    ]
    
    module_objs = []
    for name, active, desc, price in modules:
        m, c = ModuleConfig.objects.get_or_create(module_name=name)
        m.is_active = active
        m.description = desc
        m.price_per_month = price
        m.save()
        module_objs.append(m)
        
    # Bind modules to shops based on architecture plan
    shop.active_modules.set(module_objs)
    shop2.active_modules.set([m for m in module_objs if m.is_active])
    
    print("Modules seeded and attached to Shops.")

    # 3. Seasonal Offers
    offer, created = SeasonalOffer.objects.get_or_create(title="Monsoon Checkup Special")
    offer.description = "Get a free 20-point inspection and 10% off on all spare parts during the rainy season."
    offer.discount_code = "RAINY10"
    offer.is_active = True
    offer.save()
    print("Seasonal offers seeded.")

if __name__ == "__main__":
    seed()
