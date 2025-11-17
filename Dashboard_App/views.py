from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def dashboard(request):
    """
    Dashboard view for EcoTrack application
    """
    context = {
        'user': request.user,
        # Add any other context data you need
    }
    return render(request, 'Dashboard_App/dashboard.html', context)