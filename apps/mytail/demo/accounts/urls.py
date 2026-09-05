from django.urls import path
from .views import signup, login_view, profile, bookmark_blog, set_theme

urlpatterns = [
    path('signup/', signup, name='signup'),
    path('login/', login_view, name='login'),
    path('profile/', profile, name='profile'),
    path('bookmark/<int:pk>/', bookmark_blog, name='bookmark_blog'),
    path('set-theme/', set_theme, name='set_theme'),
]
