from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

def signup_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        confirm = request.POST.get('confirm_password')
        if not username or not password or password != confirm:
            messages.error(request, 'Please correct the errors below.')
            return render(request, 'Signup_App/signup.html')
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return render(request, 'Signup_App/signup.html')
        user = User.objects.create_user(username=username, password=password)
        user.save()
        messages.success(request, 'Account created successfully! You can now log in.')
        return redirect('login') 
    return render(request, 'Signup_App/signup.html')


def login_view(request):
	if request.method == 'POST':
		identifier = request.POST.get('username', '').strip()
		password = request.POST.get('password', '').strip()
		remember = request.POST.get('remember') == 'on'

		user = None
		if identifier and password:
			user = authenticate(request, username=identifier, password=password)

			if user is None:
				try:
					matched_user = User.objects.get(email__iexact=identifier)
					user = authenticate(request, username=matched_user.username, password=password)
				except User.DoesNotExist:
					pass
				except User.MultipleObjectsReturned:
					matched_user = User.objects.filter(email__iexact=identifier).order_by('id').first()
					if matched_user:
						user = authenticate(request, username=matched_user.username, password=password)

		if user is not None:
			login(request, user)
			if not remember:
				request.session.set_expiry(0) 
			else:
				request.session.set_expiry(60 * 60 * 24 * 30) 

			return redirect('Login_App:dashboard')
		else:
			messages.error(request, 'Invalid username/email or password. Please try again.')

	return render(request, 'Login_App/login.html')


def logout_view(request):
	logout(request)
	return redirect('Login_App:login')


@login_required
def dashboard(request):
	return render(request, 'Login_App/dashboard.html')