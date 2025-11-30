from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Q, Sum

from Activity_App.models import Activity


def get_dashboard_data(user):
	"""Calculate updated dashboard data including breakdown, recent activities, and points."""
	# Calculate breakdown by category
	totals = Activity.objects.filter(user=user).values('category').annotate(total=Sum('impact'))
	breakdown = {'transportation': 0.0, 'diet': 0.0, 'energy': 0.0, 'shopping': 0.0}
	for t in totals:
		cat = t['category']
		try:
			breakdown[cat] = float(t['total'] or 0)
		except Exception:
			breakdown[cat] = 0.0
	
	# Get recent activities (limit 5 for dashboard)
	recent_qs = Activity.objects.filter(user=user).order_by('-created_at')[:5]
	recent = []
	for a in recent_qs:
		recent.append({
			'id': a.id,
			'category': a.category,
			'subtype': a.subtype or '',
			'distance': a.distance,
			'amount': a.amount,
			'impact': float(a.impact),
			'date': a.date.isoformat() if a.date else None,
			'created_at': a.created_at.isoformat(),
		})
	
	# Calculate total footprint
	total_footprint = sum(breakdown.values())
	
	# Get points total
	try:
		from Dashboard_App.models import UserPoints
		up = UserPoints.objects.filter(user=user).first()
		points_total = int(up.total_points or 0) if up else 0
	except Exception:
		try:
			from Challenges_App.models import UserChallenge
			points_total = int(UserChallenge.objects.filter(user=user, completed=True).aggregate(
				total=Sum('challenge__points'))['total'] or 0)
		except Exception:
			points_total = 0
	
	return {
		'breakdown': breakdown,
		'recent': recent,
		'total_footprint': round(total_footprint, 2),
		'points': points_total,
	}


@login_required
def history_view(request):
	"""Render the logged-in user's activity history.

	Returns a list of dicts with fields expected by the `History.html` template:
	`date`, `activity`, `duration`, `notes`, `id`.
	"""
	user = request.user

	qs = Activity.objects.filter(user=user).order_by('-created_at')

	history_items = []
	for a in qs:
		# Map Activity model fields into the template-friendly shape
		activity_label = a.category.title() if a.category else 'Activity'
		subtype = a.subtype or ''
		# Compose a short description depending on category
		if a.category == 'transportation' or a.category == 'transport':
			desc = f"{subtype or a.subtype or ''}"
			duration = f"{a.distance or ''} km"
			notes = ''
		elif a.category == 'diet':
			desc = f"{subtype or 'Meal'}"
			duration = '-'
			notes = ''
		elif a.category == 'energy':
			desc = f"{subtype or 'Energy'}"
			duration = f"{a.amount or ''} kWh"
			notes = ''
		else:
			desc = subtype or activity_label
			duration = '-'
			notes = ''

		history_items.append({
			'id': a.id,
			'date': a.date.isoformat() if a.date else a.created_at.date().isoformat(),
			'activity': desc,
			'duration': duration,
			'notes': notes,
		})

	return render(request, 'History.html', {'history_items': history_items})


@login_required
@require_POST
def delete_activity(request, activity_id):
	"""Delete an activity and recalculate badges/challenges that may be affected."""
	try:
		activity = get_object_or_404(Activity, id=activity_id, user=request.user)
		
		# Store activity details before deletion for badge recalculation
		user = activity.user
		category = activity.category
		subtype = activity.subtype
		
		# Delete the activity
		activity.delete()
		
		# Re-evaluate badges that might be affected
		reevaluate_badges_after_deletion(user, category, subtype)
		
		# Calculate updated dashboard data
		updated_data = get_dashboard_data(user)
		
		return JsonResponse({
			'success': True, 
			'message': 'Activity deleted successfully',
			'dashboard_data': updated_data
		})
	except Exception as e:
		return JsonResponse({'success': False, 'error': str(e)}, status=400)


def reevaluate_badges_after_deletion(user, category, subtype):
	"""Check if user still qualifies for badges after activity deletion."""
	try:
		from Dashboard_App.models import UserBadge
		from Challenges_App.models import Challenge, UserChallenge
		from django.db.models import Sum
		from django.utils import timezone
		
		# ECO COMMUTER: Check if user still qualifies (5 trips or 50km of bike/walk)
		if category in ['transportation', 'transport'] and subtype and subtype.lower() in ['bicycle', 'walk']:
			eco_qs = Activity.objects.filter(user=user).filter(
				Q(category='transportation') | Q(category='transport')
			).filter(Q(subtype__iexact='bicycle') | Q(subtype__iexact='walk'))
			eco_trips = eco_qs.count()
			eco_km = float(eco_qs.aggregate(total_km=Sum('distance'))['total_km'] or 0)
			
			if eco_trips < 5 and eco_km < 50:
				# Remove badge if no longer qualified
				UserBadge.objects.filter(user=user, key='eco_commuter').delete()
				# Mark challenge as incomplete
				ch = Challenge.objects.filter(key__iexact='eco_commuter').first()
				if ch:
					UserChallenge.objects.filter(user=user, challenge=ch).update(
						completed=False, completed_at=None
					)
		
		# GREEN EATER: Check if user still has 7+ veg/vegan meals
		if category == 'diet' and subtype and subtype.lower() in ['vegetarian', 'vegan']:
			green_qs = Activity.objects.filter(user=user, category='diet').filter(
				Q(subtype__iexact='vegetarian') | Q(subtype__iexact='vegan')
			)
			green_meals = green_qs.count()
			
			if green_meals < 7:
				UserBadge.objects.filter(user=user, key='green_eater').delete()
				ch = Challenge.objects.filter(key__iexact='green_eater').first()
				if ch:
					UserChallenge.objects.filter(user=user, challenge=ch).update(
						completed=False, completed_at=None
					)
		
		# RECYCLING CHAMPION: Check if user still has 5+ recycle activities
		if category == 'shopping' and subtype and any(word in subtype.lower() for word in ['recycle', 'reused', 'upcycle']):
			recycle_qs = Activity.objects.filter(user=user, category='shopping').filter(
				Q(subtype__icontains='recycle') | Q(subtype__icontains='reused') | Q(subtype__icontains='upcycle')
			)
			if recycle_qs.count() < 5:
				UserBadge.objects.filter(user=user, key='recycling_champion').delete()
				ch = Challenge.objects.filter(key__iexact='recycling_champion').first()
				if ch:
					UserChallenge.objects.filter(user=user, challenge=ch).update(
						completed=False, completed_at=None
					)
		
	except Exception:
		# Best effort - don't raise errors
		pass
