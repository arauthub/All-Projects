from django.shortcuts import render, redirect
from blog.forms import BlogPostForm
from django.contrib.auth.decorators import login_required
from blog.models import BlogPost, Comment, Like
from django.contrib.auth.models import User
from django.db.models import Count
from .forms import NewsletterForm
from .models import NewsletterSubscriber


@login_required
def home_page(request):
    # Allow creating a blog directly from the homepage
    if request.method == 'POST':
        form = BlogPostForm(request.POST)
        if form.is_valid():
            blog = form.save(commit=False)
            blog.author = request.user
            blog.save()
            return redirect('blog_detail', pk=blog.pk)
    else:
        form = BlogPostForm()

    # Dashboard data
    posts = BlogPost.objects.all().order_by('-created_at')[:10]
    # Recent posts for Recent Activity (show latest up to 5)
    recent_posts = BlogPost.objects.select_related('author').order_by('-created_at')[:5]
    recent_comments = Comment.objects.select_related('post', 'author').order_by('-created_at')[:6]
    recent_likes = Like.objects.select_related('post', 'user').order_by('-created_at')[:6]
    recent_users = User.objects.order_by('-date_joined')[:6]
    top_posts = BlogPost.objects.annotate(num_likes=Count('likes')).order_by('-num_likes', '-created_at')[:5]

    return render(request, 'home/home_page.html', {
        'blog_form': form,
        'posts': posts,
    'recent_posts': recent_posts,
    'recent_comments': recent_comments,
    'recent_likes': recent_likes,
        'recent_users': recent_users,
        'top_posts': top_posts,
        'newsletter_form': NewsletterForm(),
    })


def subscribe_newsletter(request):
    if request.method == 'POST':
        form = NewsletterForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            name = form.cleaned_data.get('name', '')
            subscriber, created = NewsletterSubscriber.objects.get_or_create(email=email)
            if name:
                subscriber.name = name
                subscriber.save()
    return redirect('home')
