from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def recycling(request):
    """Display the recycling guide page."""
    return render(request, 'Recycling_App/recycling.html')
