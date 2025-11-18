from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def history_view(request):
	"""Render the user's activity history.

	For now this returns placeholder data. If you have a model for activities
	we can replace the placeholder with a real query (e.g. Activity.objects.filter(user=...)).
	"""
	# Placeholder sample data — replace with actual queryset when model exists
	sample_history = [
		{'date': '2025-11-17', 'activity': 'Biked to work', 'duration': '30 min', 'notes': 'Nice weather'},
		{'date': '2025-11-16', 'activity': 'Vegetarian lunch', 'duration': '-', 'notes': 'Salad'},
		{'date': '2025-11-14', 'activity': 'Used public transport', 'duration': '45 min', 'notes': 'Bus 42'},
	]

	return render(request, 'History.html', {'history_items': sample_history})
