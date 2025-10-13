from django.shortcuts import render

def homepage_view(request):
    return render(request, 'Homepage_App/homepage.html')

