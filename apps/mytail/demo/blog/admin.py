from django.contrib import admin
from .models import BlogPost, Comment, Like

class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0

class LikeInline(admin.TabularInline):
    model = Like
    extra = 0

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at', 'total_likes')
    inlines = [CommentInline, LikeInline]

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('post', 'author', 'created_at')

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('post', 'user', 'created_at')
