from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
import json

from Activity_App.models import Activity


@login_required
def dashboard(request):
    """
    Dashboard view for EcoTrack application. Compute per-category totals and recent activities
    for the logged-in user and pass them to the template for initial rendering.
    """
    user = request.user

    totals = Activity.objects.filter(user=user).values('category').annotate(total=Sum('impact'))
    breakdown = {'transportation': 0.0, 'diet': 0.0, 'energy': 0.0, 'shopping': 0.0}
    for t in totals:
        cat = t['category']
        try:
            breakdown[cat] = float(t['total'] or 0)
        except Exception:
            breakdown[cat] = 0.0

    # recent activities (limit 5 for dashboard)
    recent_qs = Activity.objects.filter(user=user).order_by('-created_at')[:5]
    recent = []
    for a in recent_qs:
        recent.append({
            'id': a.id,
            'category': a.category,
            'subtype': a.subtype,
            'distance': a.distance,
            'amount': a.amount,
            'impact': float(a.impact),
            'date': a.date.isoformat() if a.date else None,
            'created_at': a.created_at.isoformat(),
        })

    init_data = {
        'breakdown': breakdown,
        'recent': recent,
    }

    context = {
        'user': user,
        'init_data_json': json.dumps(init_data),
    }
    return render(request, 'Dashboard_App/dashboard.html', context)