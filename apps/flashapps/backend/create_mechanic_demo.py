import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "flashapps_backend.settings.dev")
django.setup()

from home.models import ModularPage, HomePage
from wagtail.models import Page
from django.contrib.contenttypes.models import ContentType

def create_mechanic_demo():
    # Get Home page (Site Root)
    try:
        parent = Page.objects.get(id=3)
    except Page.DoesNotExist:
        print("Home page (ID 3) not found. Using root (ID 1).")
        parent = Page.objects.get(id=1)
    
    # Define the mechanic platform page
    page_title = "Mechanic Platform"
    page_slug = "mechanic-platform"
    
    # Delete existing if any
    ModularPage.objects.filter(slug=page_slug).delete()
    print("Cleaned up existing mechanic platform page.")

    # Create the demo page
    mechanic_page = ModularPage(
        title=page_title,
        slug=page_slug,
        body=[
            ('hero', {
                "title": "Mechanic Service Hub",
                "subtitle": "Streamlined workflow for bike registration, service tracking, and automated invoicing.",
                "image": "https://picsum.photos/seed/mechanic/1920/1080",
                "button_text": "Start New Registration",
                "button_url": "#workflow"
            }),
            ('divider', None),
            ('stepper', {
                "title": "Service Workflow",
                "steps": [
                    {
                        "label": "Bike Registration",
                        "content": "<h4>Customer & Bike Details</h4><p>Enter the bike model, engine number, and customer contact information to initiate the service record.</p>"
                    },
                    {
                        "label": "Mechanic Assignment",
                        "content": "<h4>Expert Allocation</h4><p>Our system suggests the best mechanic based on the bike brand (Yamaha, Honda, Ducati). <b>Mechanic 'John Doe' assigned.</b></p>"
                    },
                    {
                        "label": "Service Checks",
                        "content": "<h4>Live Progress</h4><p>The mechanic is currently performing engine diagnostics and oil filter replacement. Notifications are being sent to the user via SMS.</p>"
                    },
                    {
                        "label": "Invoice & Delivery",
                        "content": "<h4>Ready for Pickup</h4><p>Service completed. Final quality check passed. The invoice for parts and labor is generated below.</p>"
                    }
                ]
            }),
            ('table', {
                "title": "Live Service Requests",
                "headers": ["Job ID", "Bike Model", "Mechanic", "Status", "Estimated Delivery"],
                "rows": [
                    ["BK-101", "Ducati Panigale V4", "Mario Rossi", "Engine Service", "Today 5:00 PM"],
                    ["BK-102", "Honda CBR600RR", "Luigi B.", "Brake Pad Change", "Tomorrow 10:00 AM"],
                    ["BK-103", "Yamaha MT-07", "Sarah J.", "Chain Lubing", "Ready"]
                ]
            }),
            ('divider', None),
            ('table', {
                "title": "Service Invoice: BK-101",
                "headers": ["Part Name", "Quantity", "Unit Price", "Total"],
                "rows": [
                    ["Synthetic Oil (4L)", "1", "$80.00", "$80.00"],
                    ["Oil Filter", "1", "$15.00", "$15.00"],
                    ["Spark Plugs (Set of 4)", "1", "$45.00", "$45.00"],
                    ["Labor Charges", "2 Hours", "$50/hr", "$100.00"],
                    ["<b>Grand Total</b>", "", "", "<b>$240.00</b>"]
                ]
            }),
            ('progress', {
                "label": "Daily Workshop Capacity",
                "value": 75,
                "mode": "determinate"
            }),
            ('cards', [
                {
                    "title": "Certified Mechanics",
                    "content": "<p>Meet our team of 10+ certified experts specialized in high-performance superbikes.</p>",
                    "image": "https://picsum.photos/seed/team/600/400"
                },
                {
                    "title": "Genuine Parts",
                    "content": "<p>We only use OEM parts and premium lubricants to ensure your bike stays in peak condition.</p>",
                    "image": "https://picsum.photos/seed/parts/600/400"
                }
            ])
        ]
    )

    parent.add_child(instance=mechanic_page)
    mechanic_page.save_revision().publish()
    print(f"Created 'Mechanic Platform' page with ID: {mechanic_page.id}")

if __name__ == "__main__":
    create_mechanic_demo()
