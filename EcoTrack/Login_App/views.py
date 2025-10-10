from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required


def login_view(request):
	"""Simple login view that supports 'Remember Me'.

	- GET: show the login form
	- POST: validate username/password and login the user
	"""
	if request.method == 'POST':
		username = request.POST.get('username', '').strip()
		password = request.POST.get('password', '').strip()
		remember = request.POST.get('remember') == 'on'

		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			# If the user didn't ask to be remembered, expire the session on browser close
			if not remember:
				request.session.set_expiry(0)  # session expires on browser close
			else:
				request.session.set_expiry(60 * 60 * 24 * 30)  # 30 days

			return redirect('Login_App:dashboard')
		else:
			# Wrong credentials — show a helpful error
			messages.error(request, 'Invalid username or password. Please try again.')

	# If GET or failed POST, render the login template
	return render(request, 'Login_App/login.html')


def logout_view(request):
	logout(request)
	return redirect('Login_App:login')


@login_required
def dashboard(request):
	# Simple placeholder dashboard — requires login in a real app
	return render(request, 'Login_App/dashboard.html')

