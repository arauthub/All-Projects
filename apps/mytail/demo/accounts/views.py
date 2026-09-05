from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import AuthenticationForm
from .forms import SignupForm, LoginForm
from .models import UserProfile
from blog.models import BlogPost
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST


@login_required
@require_POST
def set_theme(request):
    theme = request.POST.get('theme')
    if theme in dict(UserProfile.THEME_CHOICES):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.default_theme = theme
        profile.save()
    return redirect(request.META.get('HTTP_REFERER', '/'))

def signup(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            login(request, user)
            return redirect('/')  # Change 'home' to your homepage url name
    else:
        form = SignupForm()
    return render(request, 'accounts/signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('/')  # Change 'home' to your homepage url name
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})

@login_required
def profile(request):
    user_profile = UserProfile.objects.get(user=request.user)
    bookmarks = user_profile.bookmarks.all()
    return render(request, 'accounts/profile.html', {'profile': user_profile, 'bookmarks': bookmarks})

@login_required
def bookmark_blog(request, pk):
    blog = BlogPost.objects.get(pk=pk)
    user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if blog in user_profile.bookmarks.all():
        user_profile.bookmarks.remove(blog)
    else:
        user_profile.bookmarks.add(blog)
    return redirect(request.META.get('HTTP_REFERER', '/blog/'))
