from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

def signup(request):
    """
    Handle sign up with server-side email validation and user creation.
    On success: show success message then redirect to login (client-side).
    On failure: add error messages and re-render the signup page.
    """
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        confirm = request.POST.get('confirm_password', '')

        errors = []

        # Required fields
        if not username:
            errors.append('Username is required.')
        if not email:
            errors.append('Email is required.')
        else:
            # Validate email format
            try:
                validate_email(email)
            except ValidationError:
                errors.append('Please enter a valid email address.')

        if not password:
            errors.append('Password is required.')
        if password and password != confirm:
            errors.append('Passwords do not match.')

        # Uniqueness checks
        if username and User.objects.filter(username=username).exists():
            errors.append('Username already exists.')
        if email and User.objects.filter(email=email).exists():
            errors.append('An account with this email already exists.')

        if errors:
            for err in errors:
                messages.error(request, err)
            # return form with previously-entered username/email so user doesn't have to retype
            return render(request, 'Signup_App/signup.html', {
                'prefill': {'username': username, 'email': email}
            })

        # Create user (do not auto-login; ask user to log in)
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()

        # Add success message and render signup page.
        messages.success(request, 'Registration successful. Please log in.')
        return render(request, 'Signup_App/signup.html', {
            'redirect_to_login': True,
            'redirect_delay': 1500,           # milliseconds (1.5s)
            'prefill': {'username': username, 'email': email}
        })

    return render(request, 'Signup_App/signup.html')