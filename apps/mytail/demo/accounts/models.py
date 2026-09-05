from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    default_theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='light')
    bookmarks = models.ManyToManyField('blog.BlogPost', blank=True, related_name='bookmarked_by')

    def __str__(self):
        return f"{self.user.username} Profile"
