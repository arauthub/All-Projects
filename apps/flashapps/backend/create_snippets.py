import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "flashapps_backend.settings.dev")
django.setup()

from home.models import MaterialSnippet
from wagtail.blocks import StreamValue

def create_snippets():
    # Helper to create a snippet if not exists
    def get_or_create_snippet(title, block_type, value):
        snippet, created = MaterialSnippet.objects.get_or_create(title=title)
        # Wrap the value in the correct StreamValue structure for a StreamField with only one block allowed
        # StreamField expects a list of (type, value) tuples or a StreamValue object
        snippet.component = [(block_type, value)]
        snippet.save()
        print(f"{'Created' if created else 'Updated'} snippet: {title}")

    # 1. Hero Snippet
    get_or_create_snippet(
        "Standard Hero", 
        "hero", 
        {
            "title": "Welcome to FlashApps",
            "subtitle": "The most powerful modular website builder for Angular & Wagtail.",
            "image": "https://picsum.photos/seed/hero/1920/1080",
            "button_text": "Explore Features",
            "button_url": "http://localhost:4200/pages/7"
        }
    )

    # 2. Feature Snippet
    get_or_create_snippet(
        "Modular Feature",
        "feature",
        {
            "icon": "auto_awesome",
            "title": "AI Powered",
            "description": "Leverage the power of AI to build stunning websites in seconds."
        }
    )

    # 3. Card Snippet
    get_or_create_snippet(
        "Product Card",
        "card",
        {
            "image": "https://picsum.photos/seed/card/800/600",
            "title": "Modern Material Design",
            "content": "<p>Our components are built with <b>Material 3</b> standards, ensuring a premium look and feel out of the box.</p>"
        }
    )

    # 4. Tabs Snippet
    get_or_create_snippet(
        "Services Tabs",
        "tabs",
        {
            "tabs": [
                {"label": "Design", "content": "<p>Professional UI/UX design services.</p>"},
                {"label": "Development", "content": "<p>Scalable Angular applications.</p>"},
                {"label": "CMS", "content": "<p>Easy content management with Wagtail.</p>"}
            ]
        }
    )

    # 5. Accordion Snippet
    get_or_create_snippet(
        "FAQ Accordion",
        "accordion",
        {
            "items": [
                {"header": "Is it responsive?", "content": "<p>Yes, all components are fully mobile-friendly.</p>"},
                {"header": "Can I customize the colors?", "content": "<p>Absolutely! We use standard Material theme tokens.</p>"}
            ]
        }
    )

    # 6. Slider Snippet
    get_or_create_snippet(
        "Volume Slider",
        "slider",
        {
            "label": "Interaction Level",
            "min_value": 0,
            "max_value": 100,
            "step": 5
        }
    )

    # 7. Toggle Snippet
    get_or_create_snippet(
        "Dark Mode Toggle",
        "toggle",
        {
            "label": "Enable Dark Mode",
            "default_value": True
        }
    )

    print("All Material Snippets created successfully!")

if __name__ == "__main__":
    create_snippets()
