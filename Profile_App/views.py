from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import Profile

@login_required
def profile(request):
    """
    Display and handle editing of user profile details.
    On GET: Show current user details in a form.
    On POST: Validate and update user fields, then redirect back.
    """
    user = request.user
    
    if request.method == 'POST':
        # Get form data
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        current_password = request.POST.get('current_password', '')
        new_password = request.POST.get('new_password', '')
        confirm_new_password = request.POST.get('confirm_new_password', '')
        
        errors = []
        
        # Validate required fields
        if not username:
            errors.append('Username is required.')
        if not email:
            errors.append('Email is required.')
        else:
            try:
                validate_email(email)
            except ValidationError:
                errors.append('Please enter a valid email address.')
        
        # Check uniqueness (exclude current user)
        if username and User.objects.filter(username=username).exclude(id=user.id).exists():
            errors.append('Username already exists.')
        if email and User.objects.filter(email=email).exclude(id=user.id).exists():
            errors.append('An account with this email already exists.')
        
        # Password change validation
        if new_password or confirm_new_password:
            if not user.check_password(current_password):
                errors.append('Current password is incorrect.')
            if new_password != confirm_new_password:
                errors.append('New passwords do not match.')
            if new_password and len(new_password) < 8:
                errors.append('New password must be at least 8 characters long.')
            # Add more password strength checks if needed (e.g., uppercase, symbols)
        
        if errors:
            for err in errors:
                messages.error(request, err)
        else:
            # Update user fields
            user.username = username
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            if new_password:
                user.set_password(new_password)
                update_session_auth_hash(request, user)  # Keep user logged in after password change
            user.save()
            # Handle avatar upload if provided
            try:
                profile, _ = Profile.objects.get_or_create(user=user)
                avatar = request.FILES.get('avatar')
                if avatar:
                    profile.avatar = avatar
                    profile.save()
            except Exception:
                # don't block profile update on avatar errors
                pass
            messages.success(request, 'Profile updated successfully.')
            return redirect('Profile_App:profile')
    
    # GET: Render form with current data
    context = {
        'user': user,
        'profile': Profile.objects.get_or_create(user=user)[0],
    }
    return render(request, 'Profile_App/profile.html', context)