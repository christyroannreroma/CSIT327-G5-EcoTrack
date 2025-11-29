from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone

from .models import Challenge, UserChallenge
import random
from hashlib import sha256


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
	# return exactly 3 challenges per user, randomized per-user per-day (GMT+8)
	all_challenges = list(Challenge.objects.filter(is_active=True))

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
	# use the date in GMT+8 as the seed element so selection is stable per user per day
	seed_date = now_tz.date().isoformat()

	# deterministic per-user-per-day randomization
	seed_input = f"{user.id}:{seed_date}"
	seed = int(sha256(seed_input.encode('utf-8')).hexdigest(), 16) & 0xffffffff
	rnd = random.Random(seed)
	rnd.shuffle(all_challenges)
	# Prefer challenges that can be achieved via activities (badge-related)
	ACHIEVABLE_KEYS = {'eco_commuter', 'green_eater', 'recycling_champion', 'energy_saver', 'carbon_neutral'}
	def is_activity_achievable(ch):
		if getattr(ch, 'key', None):
			if ch.key.lower() in ACHIEVABLE_KEYS:
				return True
		# fallback: check title tokens
		title = (ch.title or '').lower()
		for tok in ('eco commuter','bike','commuter','vegetarian','vegan','recycle','recycling','renewable','carbon'):
			if tok in title:
				return True
		return False

	# ensure we always return 3 slots: keep the first seeded choice as primary, then prefer activity-achievable challenges
	primary = all_challenges[0] if all_challenges else None
	activity_pool = [c for c in all_challenges if is_activity_achievable(c) and c != primary]
	other_pool = [c for c in all_challenges if c not in activity_pool and c != primary]
	challenges = []
	if primary:
		challenges.append(primary)
	# fill remaining slots from activity_pool, then other_pool
	for pool in (activity_pool, other_pool):
		for c in pool:
			if len(challenges) >= 3:
				break
			challenges.append(c)
		if len(challenges) >= 3:
			break
	data = []
	# preload userchallenge mapping
	uc_qs = UserChallenge.objects.filter(user=user, challenge__in=challenges)
	uc_map = {uc.challenge_id: uc for uc in uc_qs}
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
