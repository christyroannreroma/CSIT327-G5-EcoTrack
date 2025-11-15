from django.urls import path
from . import views

app_name = 'Dashboard_App'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
]