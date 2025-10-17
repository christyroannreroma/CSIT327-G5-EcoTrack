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
        identifierVar = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        remember = request.POST.get('remember') == 'on'

        errors = []
        if not identifierVar:
            errors.append('Username or email is required.')
        if not password:
            errors.append('Password is required.')
        
        if errors:
            for error in errors:
                messages.error(request, error)
            return render(request, 'Login_App/login.html')

        user = None

        user = authenticate(request, username=identifierVar, password=password)
        
        if user is None:
            try:
                matched_user = User.objects.get(email__iexact=identifierVar)
                user = authenticate(request, username=matched_user.username, password=password)
            except User.DoesNotExist:
                pass
            except User.MultipleObjectsReturned:
                matched_user = User.objects.filter(email__iexact=identifierVar).order_by('id').first()
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
    return render(request, 'Dashboard_App/dashboard.html')




# from django.shortcuts import render, redirect
# from django.contrib.auth import authenticate, login, logout
# from django.contrib import messages
# from django.contrib.auth.decorators import login_required
# from django.contrib.auth.models import User

# def signup_view(request):
#     if request.method == 'POST':
#         username = request.POST.get('username')
#         password = request.POST.get('password')
#         confirm = request.POST.get('confirm_password')
#         # Add your validation logic here
#         if not username or not password or password != confirm:
#             messages.error(request, 'Please correct the errors below.')
#             return render(request, 'Signup_App/signup.html')
#         if User.objects.filter(username=username).exists():
#             messages.error(request, 'Username already exists.')
#             return render(request, 'Signup_App/signup.html')
#         # Create user
#         user = User.objects.create_user(username=username, password=password)
#         user.save()
#         messages.success(request, 'Account created successfully! You can now log in.')
#         return redirect('login')  # 'login' should be the name of your login url
#     return render(request, 'Signup_App/signup.html')


# def login_view(request):
# 	"""Simple login view that supports 'Remember Me'.

# 	- GET: show the login form
# 	- POST: validate username/password and login the user
# 	"""
# 	if request.method == 'POST':
# 		username = request.POST.get('username', '').strip()
# 		password = request.POST.get('password', '').strip()
# 		remember = request.POST.get('remember') == 'on'

# 		user = authenticate(request, username=username, password=password)
# 		if user is not None:
# 			login(request, user)
# 			# If the user didn't ask to be remembered, expire the session on browser close
# 			if not remember:
# 				request.session.set_expiry(0)  # session expires on browser close
# 			else:
# 				request.session.set_expiry(60 * 60 * 24 * 30)  # 30 days

# 			return redirect('dashboard')
# 		else:
# 			# Wrong credentials — show a helpful error
# 			messages.error(request, 'Invalid username or password. Please try again.')

# 	# If GET or failed POST, render the login template
# 	return render(request, 'Login_App/login.html')


# def logout_view(request):
# 	logout(request)
# 	return redirect('Login_App:login')


# @login_required
# def dashboard(request):
# 	# Simple placeholder dashboard — requires login in a real app
# 	return render(request, 'Login_App/dashboard.html')



