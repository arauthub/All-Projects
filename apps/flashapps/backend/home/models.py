from django.db import models
from wagtail.models import Page
from wagtail.fields import StreamField
from wagtail import blocks
from wagtail.admin.panels import FieldPanel
from wagtail.images.blocks import ImageChooserBlock
from wagtail.snippets.models import register_snippet
from wagtail.snippets.blocks import SnippetChooserBlock
from wagtail.api import APIField
from .mechanic_models import (
    Vehicle, Mechanic, InspectionBucket, ServiceJob, Invoice, Attendance, BonusRule, Payroll, SeasonalOffer
)
from .settings_models import Shop
from .inventory_models import InventoryPart, StockTransaction
from .hr_models import BiometricLog, SalaryStructure


class HeroBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    subtitle = blocks.CharBlock(required=False)
    image = blocks.CharBlock(required=False, help_text="Image ID or external URL")
    button_text = blocks.CharBlock(required=False)
    button_url = blocks.URLBlock(required=False)

    class Meta:
        template = "home/blocks/hero_block.html"
        icon = "placeholder"
        label = "Hero"


class FeatureBlock(blocks.StructBlock):
    icon = blocks.CharBlock(required=False, help_text="Material Icon name")
    title = blocks.CharBlock(required=True)
    description = blocks.TextBlock(required=True)

    class Meta:
        template = "home/blocks/feature_block.html"
        icon = "list-ul"
        label = "Feature"


class CardBlock(blocks.StructBlock):
    image = blocks.CharBlock(required=False, help_text="Image ID or external URL")
    title = blocks.CharBlock(required=True)
    content = blocks.RichTextBlock(required=True)

    class Meta:
        template = "home/blocks/card_block.html"
        icon = "image"
        label = "Card"


class TabBlock(blocks.StructBlock):
    label = blocks.CharBlock(required=True)
    content = blocks.RichTextBlock(required=True)


class TabsBlock(blocks.StructBlock):
    tabs = blocks.ListBlock(TabBlock())

    class Meta:
        icon = "folder"
        label = "Tabs"


class AccordionItemBlock(blocks.StructBlock):
    header = blocks.CharBlock(required=True)
    content = blocks.RichTextBlock(required=True)


class AccordionBlock(blocks.StructBlock):
    items = blocks.ListBlock(AccordionItemBlock())

    class Meta:
        icon = "form"
        label = "Accordion"


class SliderBlock(blocks.StructBlock):
    label = blocks.CharBlock(required=True)
    min_value = blocks.IntegerBlock(default=0)
    max_value = blocks.IntegerBlock(default=100)
    step = blocks.IntegerBlock(default=1)

    class Meta:
        icon = "horizontalrule"
        label = "Slider"


class ToggleBlock(blocks.StructBlock):
    label = blocks.CharBlock(required=True)
    default_value = blocks.BooleanBlock(required=False)

    class Meta:
        icon = "tick"
        label = "Slide Toggle"


class ProgressBlock(blocks.StructBlock):
    label = blocks.CharBlock(required=False)
    value = blocks.IntegerBlock(default=50, help_text="0 to 100")
    mode = blocks.ChoiceBlock(choices=[
        ('determinate', 'Determinate'),
        ('indeterminate', 'Indeterminate'),
        ('buffer', 'Buffer'),
        ('query', 'Query'),
    ], default='determinate')

    class Meta:
        icon = "spinner"
        label = "Progress Bar"


class TableBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=False)
    headers = blocks.ListBlock(blocks.CharBlock(label="Header"))
    rows = blocks.ListBlock(blocks.ListBlock(blocks.CharBlock(label="Cell"), label="Row"))

    class Meta:
        icon = "table"
        label = "Data Table"


class StepBlock(blocks.StructBlock):
    label = blocks.CharBlock(required=True)
    content = blocks.RichTextBlock(required=True)


class StepperBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=False)
    steps = blocks.ListBlock(StepBlock())

    class Meta:
        icon = "order"
        label = "Stepper/Workflow"


@register_snippet
class MaterialSnippet(models.Model):
    title = models.CharField(max_length=255)
    component = StreamField([
        ('hero', HeroBlock()),
        ('feature', FeatureBlock()),
        ('card', CardBlock()),
        ('tabs', TabsBlock()),
        ('accordion', AccordionBlock()),
        ('slider', SliderBlock()),
        ('toggle', ToggleBlock()),
        ('progress', ProgressBlock()),
        ('table', TableBlock()),
        ('stepper', StepperBlock()),
    ], use_json_field=True, max_num=1, min_num=1)

    panels = [
        FieldPanel('title'),
        FieldPanel('component'),
    ]

    api_fields = [
        APIField('title'),
        APIField('component'),
    ]

    def __str__(self):
        return self.title


class ModularPage(Page):
    body = StreamField([
        ('hero', HeroBlock()),
        ('content', blocks.RichTextBlock()),
        ('features', blocks.ListBlock(FeatureBlock(), label="Features Grid")),
        ('cards', blocks.ListBlock(CardBlock(), label="Cards Grid")),
        ('tabs', TabsBlock()),
        ('accordion', AccordionBlock()),
        ('slider', SliderBlock()),
        ('toggle', ToggleBlock()),
        ('progress', ProgressBlock()),
        ('table', TableBlock()),
        ('stepper', StepperBlock()),
        ('snippet', SnippetChooserBlock(MaterialSnippet)),
        ('divider', blocks.StaticBlock(admin_text="Visual Divider")),
    ], use_json_field=True)

    api_fields = [
        APIField('body'),
    ]

    content_panels = Page.content_panels + [
        FieldPanel('body'),
    ]


class HomePage(ModularPage):
    pass
