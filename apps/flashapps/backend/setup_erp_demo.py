import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flashapps_backend.settings.dev')
django.setup()

from home.models import Vehicle, Mechanic, InspectionBucket, ServiceJob

def setup_erp_demo():
    print("Setting up ERP Demo data...")
    
    # 1. Create Mechanics
    mechanics = [
        {'name': 'Alex Johnson', 'specialty': 'Engine & Transmission'},
        {'name': 'Sarah Smith', 'specialty': 'Electronics & Diagnostics'},
        {'name': 'Mike Miller', 'specialty': 'Tyres & Suspension'},
    ]
    for m_data in mechanics:
        Mechanic.objects.get_or_create(name=m_data['name'], defaults={'specialty': m_data['specialty']})
    
    # 2. Create Inspection Buckets
    buckets = ['Engine Oil', 'Brake Pads', 'Tyre Pressure', 'Battery Health', 'Lights & Signals']
    for b_name in buckets:
        InspectionBucket.objects.get_or_create(name=b_name)
    
    # 3. Create Vehicles
    vehicles = [
        {
            'vehicle_type': 'car', 'make': 'Tesla', 'model': 'Model 3', 'year': 2022, 
            'license_plate': 'TSLA-001', 'owner_name': 'Elon Musk', 'owner_email': 'elon@tesla.com'
        },
        {
            'vehicle_type': 'bike', 'make': 'Ducati', 'model': 'Panigale V4', 'year': 2023, 
            'license_plate': 'DUK-999', 'owner_name': 'John Doe', 'owner_email': 'john@example.com'
        }
    ]
    for v_data in vehicles:
        Vehicle.objects.get_or_create(license_plate=v_data['license_plate'], defaults=v_data)
    
    # 4. Create an active Job
    vehicle = Vehicle.objects.get(license_plate='TSLA-001')
    mechanic = Mechanic.objects.get(name='Sarah Smith')
    ServiceJob.objects.get_or_create(
        vehicle=vehicle,
        defaults={
            'assigned_mechanic': mechanic,
            'status': 'working',
            'issue_description': 'Software update and battery health checkup.'
        }
    )
    
    print("ERP Demo data setup complete.")

if __name__ == "__main__":
    setup_erp_demo()
