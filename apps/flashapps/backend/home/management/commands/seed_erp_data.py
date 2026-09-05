import random
import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from home.models import Shop
from home.mechanic_models import Vehicle, Mechanic, ServiceJob, Invoice

class Command(BaseCommand):
    help = 'Seeds realistic demo entries into the ERP system'

    def handle(self, *args, **kwargs):
        shop = Shop.objects.first()
        if not shop:
            shop = Shop.objects.create(
                shop_name="Flash Motors Service Center",
                owner_name='Abhijeet Raut',
                currency_symbol='₹',
                theme_choice='midnight'
            )

        brands_models = {
            'Honda': ['Civic', 'Accord', 'CR-V'],
            'Toyota': ['Corolla', 'Camry', 'RAV4'],
            'BMW': ['3 Series', 'X5', 'M4'],
            'Ford': ['Mustang', 'F-150', 'Explorer'],
            'Audi': ['A4', 'Q7', 'R8'],
        }

        # Clear existing
        Vehicle.objects.all().delete()
        Mechanic.objects.all().delete()

        mechanics = []
        specialties = ['Engine', 'Transmission', 'Electronics', 'Bodywork', 'Brakes']
        for i in range(10):
            m = Mechanic.objects.create(
                name=f"Technician {i+1}",
                specialty=random.choice(specialties)
            )
            mechanics.append(m)

        self.stdout.write("Created Mechanics")

        statuses = ['received', 'inspection', 'working', 'ready', 'delivered']
        now = datetime.datetime.now()

        for i in range(50):
            make = random.choice(list(brands_models.keys()))
            model = random.choice(brands_models[make])
            v_type = 'car'
            
            v = Vehicle.objects.create(
                vehicle_type=v_type,
                make=make,
                model=model,
                year=random.randint(2010, 2024),
                license_plate=f"{make[:2].upper()}-{random.randint(1000,9999)}-{i}",
                owner_name=f"Customer {i+1}",
                owner_phone=f"98765-{random.randint(10000,99999)}"
            )

            job_status = random.choice(statuses)
            if random.random() > 0.4:
                job_status = 'delivered'
                
            job = ServiceJob.objects.create(
                vehicle=v,
                assigned_mechanic=random.choice(mechanics) if job_status != 'received' else None,
                status=job_status,
                issue_description=f"Standard service and {random.choice(['oil change', 'brake pad replacement', 'engine diagnostic', 'battery check'])}",
            )
            
            days_ago = random.randint(0, 60)
            job.created_at = now - datetime.timedelta(days=days_ago)
            job.save()

            if job_status in ['ready', 'delivered']:
                inv = Invoice.objects.create(
                    service_job=job,
                    labor_cost=Decimal(random.randint(500, 5000)),
                    parts_cost=Decimal(random.randint(200, 10000)),
                    is_paid=(job_status == 'delivered'),
                )
                inv.created_at = job.created_at
                inv.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded demo data into {shop.shop_name}!'))
