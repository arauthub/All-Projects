from django.utils.html import format_html
from django.contrib.auth.models import Group

from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet, SnippetViewSetGroup

from home.models import (
    Vehicle, Mechanic, ServiceJob,
    Invoice, Attendance, BonusRule, Payroll, InspectionBucket,
    SeasonalOffer, Shop, InventoryPart, StockTransaction,
    BiometricLog, SalaryStructure
)
from .community_models import CommunityPost, CommunityComment

# --- ERP Group ---

class VehicleViewSet(SnippetViewSet):
    model = Vehicle
    icon = 'doc-full'
    menu_label = 'Vehicles'
    menu_order = 100
    add_to_admin_menu = False

class MechanicViewSet(SnippetViewSet):
    model = Mechanic
    icon = 'user'
    menu_label = 'Mechanics'
    menu_order = 200
    add_to_admin_menu = False

class ServiceJobViewSet(SnippetViewSet):
    model = ServiceJob
    icon = 'cog'
    menu_label = 'Service Jobs'
    menu_order = 300
    list_display = ['job_id', 'vehicle', 'assigned_mechanic_display', 'status']
    add_to_admin_menu = False

class InvoiceViewSet(SnippetViewSet):
    model = Invoice
    icon = 'form'
    menu_label = 'Invoices'
    menu_order = 400
    list_display = ['service_job', 'total_amount', 'is_paid']
    add_to_admin_menu = False

class InspectionBucketViewSet(SnippetViewSet):
    model = InspectionBucket
    icon = 'list-ul'
    menu_label = 'Inspections'
    menu_order = 500
    add_to_admin_menu = False

class SeasonalOfferViewSet(SnippetViewSet):
    model = SeasonalOffer
    icon = 'pick'
    menu_label = 'Seasonal Offers'
    menu_order = 600
    add_to_admin_menu = False

class ERPRGroup(SnippetViewSetGroup):
    menu_label = 'Mechanic ERP'
    menu_icon = 'folder-open-inverse'
    menu_order = 200
    items = (
        VehicleViewSet,
        MechanicViewSet,
        ServiceJobViewSet,
        InvoiceViewSet,
        InspectionBucketViewSet,
        SeasonalOfferViewSet,
    )

# --- Inventory Group ---

class InventoryPartViewSet(SnippetViewSet):
    model = InventoryPart
    icon = 'pick'
    menu_label = 'Parts'
    menu_order = 100
    list_display = ['name', 'sku', 'category', 'stock_quantity', 'unit_price']
    add_to_admin_menu = False

class StockTransactionViewSet(SnippetViewSet):
    model = StockTransaction
    icon = 'list-ul'
    menu_label = 'Transactions'
    menu_order = 200
    list_display = ['part', 'transaction_type', 'quantity', 'date']
    add_to_admin_menu = False

class InventoryGroup(SnippetViewSetGroup):
    menu_label = 'Inventory'
    menu_icon = 'tag'
    menu_order = 250
    items = (
        InventoryPartViewSet,
        StockTransactionViewSet,
    )

# --- Payroll & HR Group ---

class AttendanceViewSet(SnippetViewSet):
    model = Attendance
    icon = 'date'
    menu_label = 'Attendance'
    menu_order = 100
    list_display = ['mechanic', 'date', 'status', 'check_in', 'check_out']
    add_to_admin_menu = False

class BiometricLogViewSet(SnippetViewSet):
    model = BiometricLog
    icon = 'password'
    menu_label = 'Biometric Logs'
    menu_order = 150
    list_display = ['external_id', 'timestamp', 'direction']
    add_to_admin_menu = False

class SalaryStructureViewSet(SnippetViewSet):
    model = SalaryStructure
    icon = 'site'
    menu_label = 'Salary Structures'
    menu_order = 200
    add_to_admin_menu = False

class BonusRuleViewSet(SnippetViewSet):
    model = BonusRule
    icon = 'success'
    menu_label = 'Bonus Rules'
    menu_order = 250
    add_to_admin_menu = False

class PayrollViewSet(SnippetViewSet):
    model = Payroll
    icon = 'folder-open-inverse'
    menu_label = 'Payroll Records'
    menu_order = 300
    list_display = ['mechanic', 'month', 'year', 'net_paid', 'is_processed']
    add_to_admin_menu = False

class HRGroup(SnippetViewSetGroup):
    menu_label = 'HR & Payroll'
    menu_icon = 'group'
    menu_order = 300
    items = (
        AttendanceViewSet,
        BiometricLogViewSet,
        SalaryStructureViewSet,
        BonusRuleViewSet,
        PayrollViewSet,
    )

# --- Community Group ---

class CommunityPostViewSet(SnippetViewSet):
    model = CommunityPost
    icon = 'comment'
    menu_label = 'Posts'
    menu_order = 100
    add_to_admin_menu = False

class CommunityCommentViewSet(SnippetViewSet):
    model = CommunityComment
    icon = 'pilcrow'
    menu_label = 'Comments'
    menu_order = 200
    add_to_admin_menu = False

class CommunityGroup(SnippetViewSetGroup):
    menu_label = 'Community'
    menu_icon = 'group'
    menu_order = 400
    items = (
        CommunityPostViewSet,
        CommunityCommentViewSet,
    )

# Register the groups
register_snippet(ERPRGroup)
register_snippet(InventoryGroup)
register_snippet(HRGroup)
register_snippet(CommunityGroup)
