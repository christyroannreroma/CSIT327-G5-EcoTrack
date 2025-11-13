from django.shortcuts import render
from django.http import HttpResponse

def activity(request):
    """
    Activity view for EcoTrack application
    """
    context = {
        'user': request.user,
        # Add any other context data you need
    }
    return render(request, 'Activity_App/activity.html', context)