from django.urls import path
from . import views

app_name = 'Activity_App'

urlpatterns = [
    path('activity/', views.activity, name='activity'),
]