from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import BlogPost, Comment, Like
from .forms import BlogPostForm, CommentForm
from django.http import JsonResponse

# Blog list view
def blog_list(request):
    posts = BlogPost.objects.all().order_by('-created_at')
    return render(request, 'blog/blog_list.html', {'posts': posts})

# Blog detail view
def blog_detail(request, pk):
    post = get_object_or_404(BlogPost, pk=pk)
    comments = post.comments.all().order_by('-created_at')
    liked = False
    if request.user.is_authenticated:
        liked = Like.objects.filter(post=post, user=request.user).exists()
    return render(request, 'blog/blog_detail.html', {
        'post': post,
        'comments': comments,
        'liked': liked,
    })

# Create blog post
@login_required
def blog_create(request):
    if request.method == 'POST':
        form = BlogPostForm(request.POST)
        if form.is_valid():
            blog = form.save(commit=False)
            blog.author = request.user
            blog.save()
            return redirect('blog_detail', pk=blog.pk)
    else:
        form = BlogPostForm()
    return render(request, 'blog/blog_form.html', {'form': form})

# Add comment
@login_required
def add_comment(request, pk):
    post = get_object_or_404(BlogPost, pk=pk)
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.author = request.user
            comment.post = post
            comment.save()
            return redirect('blog_detail', pk=pk)
    else:
        form = CommentForm()
    return render(request, 'blog/comment_form.html', {'form': form, 'post': post})

# Like post
@login_required
def like_post(request, pk):
    post = get_object_or_404(BlogPost, pk=pk)
    like, created = Like.objects.get_or_create(post=post, user=request.user)
    if not created:
        like.delete()
    return redirect('blog_detail', pk=pk)
