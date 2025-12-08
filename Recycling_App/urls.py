from django.urls import path
from . import views

app_name = 'Recycling_App'

urlpatterns = [
    path('', views.recycling, name='recycling'),
]
