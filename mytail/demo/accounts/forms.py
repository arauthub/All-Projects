from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.auth.forms import AuthenticationForm

class SignupForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not email.endswith('@gmail.com'):
            raise ValidationError('Only Gmail addresses are allowed.')
        return email

class LoginForm(AuthenticationForm):
    username = forms.CharField(label='Username or Email')
    password = forms.CharField(widget=forms.PasswordInput)
