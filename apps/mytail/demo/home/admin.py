from django.contrib import admin
from .models import NewsletterSubscriber

@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'created_at')
    search_fields = ('email', 'name')
    readonly_fields = ('created_at',)
    list_filter = ('created_at',)

    actions = ['export_as_csv']

    def export_as_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        meta = self.model._meta
        field_names = ['email', 'name', 'created_at']

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=newsletter_subscribers.csv'
        writer = csv.writer(response)
        writer.writerow(field_names)
        for obj in queryset:
            writer.writerow([getattr(obj, f) for f in field_names])
        return response

    export_as_csv.short_description = "Export selected to CSV"
