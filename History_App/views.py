from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from Activity_App.models import Activity


@login_required
def history_view(request):
	"""Render the logged-in user's activity history.

	Returns a list of dicts with fields expected by the `History.html` template:
	`date`, `activity`, `duration`, `notes`.
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
			'date': a.date.isoformat() if a.date else a.created_at.date().isoformat(),
			'activity': desc,
			'duration': duration,
			'notes': notes,
		})

	return render(request, 'History.html', {'history_items': history_items})
