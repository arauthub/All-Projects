from django.http import HttpResponseForbidden
from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import redirect

# Only allow superusers and staff to access Wagtail admin
admin_access_required = user_passes_test(lambda u: u.is_active and (u.is_superuser or u.is_staff), login_url='/accounts/login/')

@admin_access_required
def custom_wagtail_admin_login(request, *args, **kwargs):
    if not request.user.is_superuser and not request.user.is_staff:
        return HttpResponseForbidden("You need more access levels to access the admin console.")
    # Redirect to the actual Wagtail admin login page
    return redirect('/admin/')
