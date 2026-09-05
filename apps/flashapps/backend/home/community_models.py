from django.db import models
from wagtail.snippets.models import register_snippet
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField

class CommunityPost(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=150, help_text="Name of the mechanic or shop posting")
    location = models.CharField(max_length=200, help_text="Vicinity or Area")
    # wagtail-ai features typically hook into RichTextFields in the admin interface automatically
    # once the app is installed and configured.
    content = RichTextField(features=['h2', 'h3', 'bold', 'italic', 'link', 'ol', 'ul', 'hr', 'document-link', 'ai'])
    
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    panels = [
        FieldPanel('title'),
        FieldPanel('author'),
        FieldPanel('location'),
        FieldPanel('content'),
        FieldPanel('is_approved'),
    ]
    
    api_fields = [
        APIField('id'),
        APIField('title'),
        APIField('author'),
        APIField('location'),
        APIField('content'),
        APIField('is_approved'),
        APIField('created_at'),
    ]
    
    def __str__(self):
        return f"{self.title} by {self.author}"
    
    class Meta:
        verbose_name = "Community Post"
        ordering = ['-created_at']

class CommunityComment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='comments')
    author = models.CharField(max_length=150)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    panels = [
        FieldPanel('post'),
        FieldPanel('author'),
        FieldPanel('content'),
    ]
    
    api_fields = [
        APIField('id'),
        APIField('post_id'),
        APIField('author'),
        APIField('content'),
        APIField('created_at'),
    ]
    
    def __str__(self):
        return f"Comment by {self.author} on {self.post.title}"
    
    class Meta:
        verbose_name = "Community Comment"
        ordering = ['created_at']
