from django.urls import path
from . import views

app_name = 'Activity_App'

urlpatterns = [
    # app is included under project as path('activity/', include(...))
    # expose the activity page at /activity/ instead of /activity/activity/
    path('', views.activity, name='activity'),
    path('api/add/', views.add_activity, name='add_activity'),
    path('api/list/', views.list_activities, name='list_activities'),
]