from django.urls import path
from . import views

app_name = 'Profile_App'

urlpatterns = [
    path('', views.profile, name='profile'),
]

