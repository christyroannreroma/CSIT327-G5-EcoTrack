from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from Activity_App.models import Activity
from django.db.models import Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncYear, TruncWeek

@login_required
def carbon_footprint_timeseries(request):
    user = request.user
    # Aggregate by day
    daily = Activity.objects.filter(user=user).annotate(
        day=TruncDay('date')
    ).values('day').order_by('day').annotate(total=Sum('impact'))
    # Aggregate by week
    weekly = Activity.objects.filter(user=user).annotate(
        week=TruncWeek('date')
    ).values('week').order_by('week').annotate(total=Sum('impact'))
    # Aggregate by month
    monthly = Activity.objects.filter(user=user).annotate(
        month=TruncMonth('date')
    ).values('month').order_by('month').annotate(total=Sum('impact'))
    # Aggregate by year
    yearly = Activity.objects.filter(user=user).annotate(
        year=TruncYear('date')
    ).values('year').order_by('year').annotate(total=Sum('impact'))
    return JsonResponse({
        'success': True,
        'daily': list(daily),
        'weekly': list(weekly),
        'monthly': list(monthly),
        'yearly': list(yearly),
    })
