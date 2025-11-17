from django.urls import path
from . import views

app_name = 'Signup_App'

urlpatterns = [
    path('', views.signup, name='signup'),
]