import os
import django
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "flashapps_backend.settings.dev")
django.setup()

from django.contrib.auth.models import Group, Permission, User
from django.contrib.contenttypes.models import ContentType
from home.models import Shop, InventoryPart, Mechanic

def setup_erp():
    print("Setting up ERP...")
    
    # 0. Create Superuser if none exists
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Created superuser: admin / admin123")

    # 1. Create Default Shop
    shop, created = Shop.objects.get_or_create(
        id=1,
        defaults={
            'shop_name': 'Flash Motors Service Center',
            'owner_name': 'Abhijeet Raut',
            'address': 'Plot 42, Service Road, Sector 18, Gurugram',
            'contact_number': '+91-9876543210',
            'currency_symbol': '₹',
            'theme_choice': 'midnight'
        }
    )
    if created:
        print(f"Created default shop: {shop.shop_name}")
    else:
        print(f"Shop already exists: {shop.shop_name}")

    # 2. Create Groups and Permissions
    groups_config = {
        'Store Owner': {
            'models': ['vehicle', 'mechanic', 'servicejob', 'invoice', 'inventorypart', 'stocktransaction', 'attendance', 'payroll', 'biometriclog', 'salarystructure', 'shop'],
            'perms': ['add', 'change', 'delete', 'view']
        },
        'Manager': {
            'models': ['vehicle', 'mechanic', 'servicejob', 'invoice', 'inventorypart', 'stocktransaction', 'attendance', 'payroll'],
            'perms': ['add', 'change', 'view']
        },
        'Mechanic': {
            'models': ['vehicle', 'servicejob', 'attendance'],
            'perms': ['view', 'change']
        },
    }

    for group_name, config in groups_config.items():
        group, created = Group.objects.get_or_create(name=group_name)
        if created:
            print(f"Created group: {group_name}")
        
        # Clear existing permissions to avoid duplicates/stale perms
        group.permissions.clear()

        # Add permissions to group
        for model_name in config['models']:
            try:
                ct = ContentType.objects.get(app_label='home', model=model_name)
                for p in config['perms']:
                    codename = f"{p}_{model_name}"
                    try:
                        permission = Permission.objects.get(content_type=ct, codename=codename)
                        group.permissions.add(permission)
                    except Permission.DoesNotExist:
                        print(f"Warning: Permission {codename} does not exist for model {model_name}")
            except ContentType.DoesNotExist:
                print(f"Warning: ContentType for model {model_name} does not exist")

    print("Setup complete!")

if __name__ == "__main__":
    setup_erp()
