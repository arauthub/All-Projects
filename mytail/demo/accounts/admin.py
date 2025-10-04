from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'default_theme')
    list_filter = ('default_theme',)
    search_fields = ('user__username',)
