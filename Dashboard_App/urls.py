from django.urls import path
from . import views

app_name = 'Dashboard_App'

urlpatterns = [
    # included in project as path('dashboard/', include(...))
    # expose dashboard at /dashboard/ (not /dashboard/dashboard/)
    path('', views.dashboard, name='dashboard'),
]