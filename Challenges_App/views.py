from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone

from .models import Challenge, UserChallenge


@login_required
def challenges_view(request):
	"""Render the challenges page for the logged-in user."""
	# We'll let the template fetch the list via API/JS, but pass a small context
	return render(request, 'Challenges_App/challenges.html', {})


@login_required
@require_GET
def list_challenges_api(request):
	"""Return JSON list of active challenges and user's completion status."""
	user = request.user
	# return up to 3 randomized challenges per user per GMT+8 day
	# Selection is deterministic for a given user and GMT+8 date (resets at GMT+8 midnight)
	all_active = list(Challenge.objects.filter(is_active=True))
	if len(all_active) <= 3:
		challenges = all_active
	else:
		# compute GMT+8 current date for seeding
		from zoneinfo import ZoneInfo
		import datetime
		import hashlib
		import random
		try:
			tz = ZoneInfo('Asia/Manila')
		except Exception:
			# fallback to fixed-offset +8
			tz = datetime.timezone(datetime.timedelta(hours=8))
		now = timezone.now()
		now_tz = now.astimezone(tz)
		seed_date = now_tz.date().isoformat()
		# deterministic seed using user id + date
		seed_raw = f"{user.pk}:{seed_date}"
		seed_int = int(hashlib.sha256(seed_raw.encode('utf-8')).hexdigest(), 16)
		rnd = random.Random(seed_int)
		# sample 3 challenges deterministically
		challenges = rnd.sample(all_active, 3)
	data = []
	# preload userchallenge mapping
	uc_qs = UserChallenge.objects.filter(user=user, challenge__in=challenges)
	uc_map = {uc.challenge_id: uc for uc in uc_qs}
	# determine daily cutoff (GMT+8 midnight) — treat completions before cutoff as expired
	from django.utils import timezone
	from zoneinfo import ZoneInfo
	import datetime
	try:
		tz = ZoneInfo('Asia/Manila')
	except Exception:
		tz = ZoneInfo('UTC')
	now = timezone.now()
	now_tz = now.astimezone(tz)
	cutoff_tz = now_tz.replace(hour=0, minute=0, second=0, microsecond=0)
	cutoff_utc = cutoff_tz.astimezone(datetime.timezone.utc)
	for c in challenges:
		uc = uc_map.get(c.id)
		completed = False
		completed_at = None
		if uc and uc.completed and uc.completed_at:
			# only consider completed if it's after today's GMT+8 midnight
			if uc.completed_at >= cutoff_utc:
				completed = True
				completed_at = uc.completed_at.isoformat()
		data.append({
			'id': c.id,
			'title': c.title,
			'description': c.description,
			'points': c.points,
			'completed': completed,
			'completed_at': completed_at,
		})
	return JsonResponse({'success': True, 'challenges': data})


@login_required
@require_POST
def toggle_challenge_completion(request):
	"""Toggle completion state for a given challenge for the current user.

	Expects JSON: {"challenge_id": <id>, "completed": true|false }
	"""
	try:
		payload = json_from_request(request)
		cid = int(payload.get('challenge_id'))
		completed = bool(payload.get('completed'))
	except Exception:
		return HttpResponseBadRequest('Invalid payload')

	challenge = get_object_or_404(Challenge, pk=cid, is_active=True)
	uc, created = UserChallenge.objects.get_or_create(user=request.user, challenge=challenge)
	uc.completed = completed
	uc.completed_at = timezone.now() if completed else None
	uc.save()
	return JsonResponse({'success': True, 'challenge_id': cid, 'completed': uc.completed})


def json_from_request(request):
	import json
	try:
		return json.loads(request.body.decode('utf-8')) if request.body else {}
	except Exception:
		return {}
