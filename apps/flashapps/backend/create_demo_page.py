import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "flashapps_backend.settings.dev")
django.setup()

from home.models import HomePage, ModularPage
from wagtail.models import Page
from django.contrib.contenttypes.models import ContentType

def create_demo():
    # Get Home page (Site Root)
    parent = Page.objects.get(id=3)
    
    # Create the demo page
    demo_page = ModularPage(
        title="Feature Demo",
        slug="feature-demo",
        body=[
            ('hero', {
                'title': 'The Ultimate Modular Experience',
                'subtitle': 'Explore every component built with Wagtail and Angular Material.',
                'image': None,
                'button_text': 'View Showcase',
                'button_url': '/showcase'
            }),
            ('content', '<p>Welcome to the <b>FlashApps Feature Demo</b>. This page showcases every single block type available in our library, rendered dynamically from the CMS using Angular Material Design 3 principles.</p>'),
            ('features', [
                {'icon': 'bolt', 'title': 'Ligtning Fast', 'description': 'Built with performance in mind using Angular SSR.'},
                {'icon': 'palette', 'title': 'Themable', 'description': 'Fully customizable Material 3 token system.'},
                {'icon': 'extension', 'title': 'Modular', 'description': 'Drag and drop blocks to build your vision.'}
            ]),
            ('divider', {}),
            ('tabs', {
                'tabs': [
                    {'label': 'Performance', 'content': '<p>Our engine ensures that only the necessary code is loaded for each block.</p>'},
                    {'label': 'Scalability', 'content': '<p>Grow from a single landing page to a complex enterprise portal.</p>'}
                ]
            }),
            ('cards', [
                {'title': 'Module A', 'content': 'First module description with some text.'},
                {'title': 'Module B', 'content': 'Second module description with some text.'},
                {'title': 'Module C', 'content': 'Third module description with some text.'}
            ]),
            ('accordion', {
                'items': [
                    {'header': 'How does it work?', 'content': '<p>Wagtail serves the JSON, Angular renders the bricks.</p>'},
                    {'header': 'Is it open source?', 'content': '<p>Yes, the FlashApps core is available for everyone.</p>'}
                ]
            }),
            ('divider', {}),
            ('slider', {'label': 'Adjustment Level', 'min_value': 0, 'max_value': 100, 'step': 5}),
            ('toggle', {'label': 'Enable Advanced Features', 'default_value': True}),
            ('progress', {'label': 'Deployment Progress', 'value': 75, 'mode': 'determinate'}),
            ('content', '<h3>Ready to build?</h3><p>Contact our sales team today to get started with the FlashApps platform.</p>')
        ]
    )

    # Check if page already exists
    existing = ModularPage.objects.filter(slug="feature-demo").first()
    if existing:
        existing.delete()
        print("Deleted existing demo page.")

    parent.add_child(instance=demo_page)
    demo_page.save_revision().publish()
    print(f"Created 'Feature Demo' page with ID: {demo_page.id}")

if __name__ == "__main__":
    create_demo()
