from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('newsletter/subscribe/', views.subscribe_newsletter, name='newsletter_subscribe'),
]
