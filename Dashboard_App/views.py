from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.db.models import Q
import json

from Activity_App.models import Activity
from Dashboard_App.models import UserBadge
from Challenges_App.models import UserChallenge
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


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

    # Compute badge-related counters from persisted activities so badges reflect real progress
    # Eco commuter: count bike/walk trips and sum distance
    eco_qs = Activity.objects.filter(user=user).filter(
        Q(category='transportation') | Q(category='transport')
    ).filter(Q(subtype__iexact='bicycle') | Q(subtype__iexact='walk'))
    eco_trips = eco_qs.count()
    eco_km_agg = eco_qs.aggregate(total_km=Sum('distance'))
    eco_km = float(eco_km_agg['total_km'] or 0)

    # Green eater: count vegetarian/vegan meals
    green_qs = Activity.objects.filter(user=user, category='diet').filter(
        Q(subtype__iexact='vegetarian') | Q(subtype__iexact='vegan')
    )
    green_meals = green_qs.count()

    # Recycling: shopping actions whose subtype/notes mention recycle/reused/upcycle
    recycle_qs = Activity.objects.filter(user=user, category='shopping').filter(
        Q(subtype__icontains='recycle') | Q(subtype__icontains='reused') | Q(subtype__icontains='upcycle')
    )
    recycle_actions = recycle_qs.count()

    # Energy saver: energy activities marked renewable
    energy_qs = Activity.objects.filter(user=user, category='energy').filter(
        Q(subtype__icontains='renew')
    )
    renewable_uses = energy_qs.count()

    # Total footprint (kg CO2) across all categories (use breakdown sums)
    total_footprint = sum(breakdown.get(k, 0) for k in breakdown)

    # Points: sum of points from completed challenges for this user
    try:
        points_total = int(UserChallenge.objects.filter(user=user, completed=True).aggregate(total=Sum('challenge__points'))['total'] or 0)
    except Exception:
        points_total = 0

    # Fallback: include points for badges that may not have a matching UserChallenge
    try:
        user_badge_keys = list(UserBadge.objects.filter(user=user).values_list('key', flat=True))
        if user_badge_keys:
            badge_to_tokens = {
                'eco_commuter': ['eco commuter', 'eco-commuter', 'bike', 'commuter'],
                'green_eater': ['green eater', 'green-eater', 'vegetarian', 'vegan'],
                'recycling_champion': ['recycle', 'recycling'],
                'energy_saver': ['energy saver', 'energy-saver', 'renewable'],
                'carbon_neutral': ['carbon neutral', 'carbon-neutral', 'carbon']
            }
            from Challenges_App.models import Challenge
            for key in user_badge_keys:
                # prefer explicit Challenge.key matching
                ch = Challenge.objects.filter(key__iexact=key).first()
                if not ch:
                    # fallback to token/title matching
                    tokens = badge_to_tokens.get(key, [key.replace('_', ' ')])
                    for t in tokens:
                        ch = Challenge.objects.filter(title__icontains=t).first()
                        if ch:
                            break
                if ch:
                    if not UserChallenge.objects.filter(user=user, challenge=ch, completed=True).exists():
                        points_total += int(ch.points or 0)
    except Exception:
        pass

    # Fallback: if badges exist but corresponding UserChallenge wasn't created (heuristic match),
    # try to find a matching Challenge and add its points so users don't lose points.
    try:
        user_badge_keys = list(UserBadge.objects.filter(user=user).values_list('key', flat=True))
        if user_badge_keys:
            # mapping of badge key -> search tokens for challenge titles
            badge_to_tokens = {
                'eco_commuter': ['eco commuter', 'eco-commuter', 'bike', 'commuter'],
                'green_eater': ['green eater', 'green-eater', 'vegetarian', 'vegan'],
                'recycling_champion': ['recycle', 'recycling'],
                'energy_saver': ['energy saver', 'energy-saver', 'renewable'],
                'carbon_neutral': ['carbon neutral', 'carbon-neutral', 'carbon']
            }
            from Challenges_App.models import Challenge
            for key in user_badge_keys:
                # prefer explicit Challenge.key matching
                ch = Challenge.objects.filter(key__iexact=key).first()
                # skip if user already has this challenge completed
                if ch and UserChallenge.objects.filter(user=user, challenge=ch, completed=True).exists():
                    continue
                if not ch:
                    tokens = badge_to_tokens.get(key, [key.replace('_', ' ')])
                    for t in tokens:
                        ch = Challenge.objects.filter(title__icontains=t).first()
                        if ch:
                            break
                if ch:
                    if not UserChallenge.objects.filter(user=user, challenge=ch, completed=True).exists():
                        points_total += int(ch.points or 0)
                # if not found, continue to next badge
    except Exception:
        # fallback should never block rendering
        pass

    # Badge earned flags: prefer persisted UserBadge (permanent earn). Still include counters for progress display.
    badges = {
        'eco_commuter': {
            'earned': UserBadge.objects.filter(user=user, key='eco_commuter').exists(),
            'bike_walk_trips': eco_trips,
            'bike_walk_km': eco_km
        },
        'green_eater': {
            'earned': UserBadge.objects.filter(user=user, key='green_eater').exists(),
            'veg_meals': green_meals
        },
        'recycling_champion': {
            'earned': UserBadge.objects.filter(user=user, key='recycling_champion').exists(),
            'recycle_actions': recycle_actions
        },
        'energy_saver': {
            'earned': UserBadge.objects.filter(user=user, key='energy_saver').exists(),
            'renewable_uses': renewable_uses
        },
        'carbon_neutral': {
            'earned': UserBadge.objects.filter(user=user, key='carbon_neutral').exists(),
        }
    }

    init_data['badges'] = badges
    init_data['points'] = points_total

    context = {
        'user': user,
        'init_data_json': json.dumps(init_data),
    }
    return render(request, 'Dashboard_App/dashboard.html', context)


@login_required
def dashboard_status(request):
    """Return JSON with current points and badge earned flags for the logged-in user."""
    user = request.user
    try:
        points_total = int(UserChallenge.objects.filter(user=user, completed=True).aggregate(total=Sum('challenge__points'))['total'] or 0)
    except Exception:
        points_total = 0

    # Recompute progress counters for display (not authoritative for earned flags)
    eco_qs = Activity.objects.filter(user=user).filter(
        Q(category='transportation') | Q(category='transport')
    ).filter(Q(subtype__iexact='bicycle') | Q(subtype__iexact='walk'))
    eco_trips = eco_qs.count()
    eco_km_agg = eco_qs.aggregate(total_km=Sum('distance'))
    eco_km = float(eco_km_agg['total_km'] or 0)

    green_qs = Activity.objects.filter(user=user, category='diet').filter(
        Q(subtype__iexact='vegetarian') | Q(subtype__iexact='vegan')
    )
    green_meals = green_qs.count()

    recycle_qs = Activity.objects.filter(user=user, category='shopping').filter(
        Q(subtype__icontains='recycle') | Q(subtype__icontains='reused') | Q(subtype__icontains='upcycle')
    )
    recycle_actions = recycle_qs.count()

    energy_qs = Activity.objects.filter(user=user, category='energy').filter(
        Q(subtype__icontains='renew')
    )
    renewable_uses = energy_qs.count()

    badges = {
        'eco_commuter': {
            'earned': UserBadge.objects.filter(user=user, key='eco_commuter').exists(),
            'bike_walk_trips': eco_trips,
            'bike_walk_km': eco_km
        },
        'green_eater': {
            'earned': UserBadge.objects.filter(user=user, key='green_eater').exists(),
            'veg_meals': green_meals
        },
        'recycling_champion': {
            'earned': UserBadge.objects.filter(user=user, key='recycling_champion').exists(),
            'recycle_actions': recycle_actions
        },
        'energy_saver': {
            'earned': UserBadge.objects.filter(user=user, key='energy_saver').exists(),
            'renewable_uses': renewable_uses
        },
        'carbon_neutral': {
            'earned': UserBadge.objects.filter(user=user, key='carbon_neutral').exists(),
        }
    }

    return JsonResponse({'success': True, 'points': points_total, 'badges': badges})