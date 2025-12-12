from django.urls import path
from . import views
from . import api

app_name = 'Dashboard_App'

urlpatterns = [
    # included in project as path('dashboard/', include(...))
    # expose dashboard at /dashboard/ (not /dashboard/dashboard/)
    path('', views.dashboard, name='dashboard'),
    path('api/status/', views.dashboard_status, name='dashboard_status'),
    path('api/carbon-timeseries/', api.carbon_footprint_timeseries, name='carbon_footprint_timeseries'),
]