from django.urls import path
from . import views

app_name = 'History_App'

urlpatterns = [
    path('', views.history_view, name='history'),
]
