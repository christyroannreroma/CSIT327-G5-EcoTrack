from django.urls import path
from . import views

app_name = 'History_App'

urlpatterns = [
    path('', views.history_view, name='history'),
    path('delete/<int:activity_id>/', views.delete_activity, name='delete_activity'),
]
