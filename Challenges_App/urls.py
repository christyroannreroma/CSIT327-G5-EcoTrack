from django.urls import path
from . import views

app_name = 'Challenges_App'

urlpatterns = [
    path('', views.challenges_view, name='challenges'),
    path('api/toggle/', views.toggle_challenge_completion, name='toggle_challenge'),
    path('api/list/', views.list_challenges_api, name='list_challenges_api'),
]
