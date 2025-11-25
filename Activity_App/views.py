from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Sum, Count
from django.contrib.auth.decorators import login_required
import json

from .models import Activity
import logging

logger = logging.getLogger(__name__)


def activity(request):
    """
    Activity view for EcoTrack application
    """
    context = {
        'user': request.user,
    }
    return render(request, 'Activity_App/activity.html', context)


@login_required
@require_POST
def add_activity(request):
    """API endpoint to create an Activity from JSON POST body."""
    try:
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

        category = data.get('category')
        if not category:
            return JsonResponse({'success': False, 'error': 'Missing category'}, status=400)

        subtype = data.get('type') or data.get('subtype')
        distance = data.get('distance')
        amount = data.get('amount')
        impact = data.get('impact') or 0
        date = data.get('date') or None
        # normalize incoming date string to a date object if provided
        from datetime import date as _date
        date_obj = None
        if date:
            try:
                # expect ISO format YYYY-MM-DD
                date_obj = _date.fromisoformat(date)
            except Exception:
                # fallback: leave None (DB will accept null)
                date_obj = None

        # Create the Activity record
        activity_obj = Activity.objects.create(
            user=request.user,
            category=category,
            subtype=subtype,
            distance=float(distance) if distance not in (None, '') else None,
            amount=float(amount) if amount not in (None, '') else None,
            impact=impact,
            date=date_obj if date_obj else None,
        )
        # Evaluate challenges against this newly created activity and mark any matched ones as completed
        try:
            from Challenges_App.models import Challenge, UserChallenge
            from django.utils import timezone
            from zoneinfo import ZoneInfo
            import datetime

            def _matches_challenge(activity, challenge):
                # Simple heuristic rules to match activity to challenge keywords
                title = (challenge.title or '').lower()
                cat = (activity.category or '').lower()
                subtype = (activity.subtype or '').lower() if activity.subtype else ''

                # Transport-related: if challenge mentions 'bike' or 'walk' and activity is transportation with bicycle/walk
                if 'bike' in title or 'bicycle' in title or 'walk' in title:
                    return (cat.startswith('transport') or cat == 'transportation') and subtype in ('bicycle', 'bike', 'walk')

                # Diet: vegetarian/vegan/meat/fish keywords
                if 'vegetarian' in title or 'vegan' in title or 'meat' in title or 'fish' in title:
                    return cat == 'diet' and (( 'vegetarian' in title and 'vegetarian' in subtype) or ('vegan' in title and 'vegan' in subtype) or ('meat' in title and 'meat' in subtype) or ('fish' in title and 'fish' in subtype))

                # Energy: renewable keyword
                if 'renewable' in title:
                    return cat == 'energy' and subtype == 'renewable'

                # fallback: if challenge title words appear in subtype or category
                for word in title.split():
                    if word and (word in subtype or word in cat):
                        return True
                return False

            newly_completed = []
            # find active challenges and mark if matched and not already completed today (GMT+8)
            challenges = Challenge.objects.filter(is_active=True).order_by('-created_at')[:50]
            # determine today's cutoff at GMT+8 midnight
            try:
                tz = ZoneInfo('Asia/Manila')
            except Exception:
                tz = ZoneInfo('UTC')
            now = timezone.now()
            now_tz = now.astimezone(tz)
            cutoff_tz = now_tz.replace(hour=0, minute=0, second=0, microsecond=0)
            cutoff_utc = cutoff_tz.astimezone(datetime.timezone.utc)

            for ch in challenges:
                if _matches_challenge(activity_obj, ch):
                    uc, created = UserChallenge.objects.get_or_create(user=request.user, challenge=ch)
                    # if already completed today, skip
                    if uc.completed and uc.completed_at and uc.completed_at >= cutoff_utc:
                        continue
                    uc.completed = True
                    uc.completed_at = timezone.now()
                    uc.save()
                    newly_completed.append(ch.id)
        except Exception:
            newly_completed = []

        return JsonResponse({
            'success': True,
            'activity': {
                'id': activity_obj.id,
                'category': activity_obj.category,
                'subtype': activity_obj.subtype,
                'distance': activity_obj.distance,
                'amount': activity_obj.amount,
                'impact': str(activity_obj.impact),
                'date': (activity_obj.date.isoformat() if hasattr(activity_obj.date, 'isoformat') else (str(activity_obj.date) if activity_obj.date else None)),
                'created_at': activity_obj.created_at.isoformat(),
            },
            'challenges_completed': newly_completed,
        })
    except Exception as e:
        # log full traceback and return JSON error to caller to avoid 500
        logger.exception('Error in add_activity')
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
def list_activities(request):
    """Return JSON with breakdown totals and recent activities for the current user."""
    user = request.user
    totals_qs = Activity.objects.filter(user=user).values('category').annotate(total=Sum('impact'))
    breakdown = {'transportation': 0.0, 'diet': 0.0, 'energy': 0.0, 'shopping': 0.0}
    for t in totals_qs:
        cat = t['category']
        try:
            breakdown[cat] = float(t['total'] or 0)
        except Exception:
            breakdown[cat] = 0.0

    # counts per category
    counts_qs = Activity.objects.filter(user=user).values('category').annotate(count=Count('id'))
    counts = {'transportation': 0, 'diet': 0, 'energy': 0, 'shopping': 0}
    for c in counts_qs:
        counts[c['category']] = int(c['count'] or 0)

    recent_qs = Activity.objects.filter(user=user).order_by('-created_at')[:20]
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

    return JsonResponse({'success': True, 'breakdown': breakdown, 'recent': recent, 'counts': counts})