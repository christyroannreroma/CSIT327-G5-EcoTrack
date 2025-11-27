from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

# Avoid circular import at top-level: import inside signal handler when needed


class Activity(models.Model):
	CATEGORY_CHOICES = [
		('transportation', 'Transportation'),
		('diet', 'Diet'),
		('energy', 'Energy'),
		('shopping', 'Shopping'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
	category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
	subtype = models.CharField(max_length=64, blank=True, null=True)
	distance = models.FloatField(blank=True, null=True)
	amount = models.FloatField(blank=True, null=True)
	impact = models.DecimalField(max_digits=9, decimal_places=2, default=0)
	date = models.DateField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f"{self.user} - {self.category} - {self.impact} kg"


# When an Activity is created, evaluate badge criteria and persist UserBadge records
@receiver(post_save, sender='Activity_App.Activity')
def award_badges_on_activity(sender, instance, created, **kwargs):
	# Only evaluate on create to avoid re-running for updates
	if not created:
		return

	try:
		# import here to avoid circular imports
		from Dashboard_App.models import UserBadge
		from django.db.models import Q, Sum

		user = instance.user

		# ECO COMMUTER: bike/walk trips or km
		eco_qs = sender.objects.filter(user=user).filter(Q(category='transportation') | Q(category='transport'))
		eco_qs = eco_qs.filter(Q(subtype__iexact='bicycle') | Q(subtype__iexact='walk'))
		eco_trips = eco_qs.count()
		eco_km = float(eco_qs.aggregate(total_km=Sum('distance'))['total_km'] or 0)
		if (eco_trips >= 5 or eco_km >= 50) and not UserBadge.objects.filter(user=user, key='eco_commuter').exists():
			ub = UserBadge.objects.create(user=user, key='eco_commuter', earned_at=timezone.now())
			# mark related Challenge as completed for points (prefer Challenge.key)
			try:
				from Challenges_App.models import Challenge, UserChallenge as CU
				ch = Challenge.objects.filter(key__iexact='eco_commuter').first()
				if not ch:
					ch = Challenge.objects.filter(title__icontains='eco commuter').first() or Challenge.objects.filter(title__icontains='eco').first()
				if ch:
					uc_obj, _ = CU.objects.get_or_create(user=user, challenge=ch)
					uc_obj.completed = True
					uc_obj.completed_at = timezone.now()
					uc_obj.save()
			except Exception:
				pass

		# GREEN EATER: veg/vegan meals
		green_qs = sender.objects.filter(user=user, category='diet').filter(Q(subtype__iexact='vegetarian') | Q(subtype__iexact='vegan'))
		green_meals = green_qs.count()
		if green_meals >= 7 and not UserBadge.objects.filter(user=user, key='green_eater').exists():
			ub = UserBadge.objects.create(user=user, key='green_eater', earned_at=timezone.now())
			try:
				from Challenges_App.models import Challenge, UserChallenge as CU
				ch = Challenge.objects.filter(key__iexact='green_eater').first()
				if not ch:
					ch = Challenge.objects.filter(title__icontains='green eater').first() or Challenge.objects.filter(title__icontains='green').first()
				if ch:
					uc_obj, _ = CU.objects.get_or_create(user=user, challenge=ch)
					uc_obj.completed = True
					uc_obj.completed_at = timezone.now()
					uc_obj.save()
			except Exception:
				pass

		# RECYCLING CHAMPION: shopping notes mention recycle/reused/upcycle
		recycle_qs = sender.objects.filter(user=user, category='shopping').filter(
			Q(subtype__icontains='recycle') | Q(subtype__icontains='reused') | Q(subtype__icontains='upcycle')
		)
		if recycle_qs.count() >= 5 and not UserBadge.objects.filter(user=user, key='recycling_champion').exists():
			ub = UserBadge.objects.create(user=user, key='recycling_champion', earned_at=timezone.now())
			try:
				from Challenges_App.models import Challenge, UserChallenge as CU
				ch = Challenge.objects.filter(key__iexact='recycling_champion').first()
				if not ch:
					ch = Challenge.objects.filter(title__icontains='recycle').first()
				if ch:
					uc_obj, _ = CU.objects.get_or_create(user=user, challenge=ch)
					uc_obj.completed = True
					uc_obj.completed_at = timezone.now()
					uc_obj.save()
			except Exception:
				pass

		# ENERGY SAVER: renewable energy uses
		energy_qs = sender.objects.filter(user=user, category='energy').filter(Q(subtype__icontains='renew'))
		if energy_qs.count() >= 5 and not UserBadge.objects.filter(user=user, key='energy_saver').exists():
			ub = UserBadge.objects.create(user=user, key='energy_saver', earned_at=timezone.now())
			try:
				from Challenges_App.models import Challenge, UserChallenge as CU
				ch = Challenge.objects.filter(key__iexact='energy_saver').first()
				if not ch:
					ch = Challenge.objects.filter(title__icontains='energy').first()
				if ch:
					uc_obj, _ = CU.objects.get_or_create(user=user, challenge=ch)
					uc_obj.completed = True
					uc_obj.completed_at = timezone.now()
					uc_obj.save()
			except Exception:
				pass

		# CARBON NEUTRAL: total footprint <= 0.5 kg (computed across activities)
		totals = sender.objects.filter(user=user).aggregate(total=Sum('impact'))
		total_footprint = float(totals['total'] or 0)
		if total_footprint <= 0.5 and not UserBadge.objects.filter(user=user, key='carbon_neutral').exists():
			ub = UserBadge.objects.create(user=user, key='carbon_neutral', earned_at=timezone.now())
			try:
				from Challenges_App.models import Challenge, UserChallenge as CU
				ch = Challenge.objects.filter(key__iexact='carbon_neutral').first()
				if not ch:
					ch = Challenge.objects.filter(title__icontains='carbon').first() or Challenge.objects.filter(title__icontains='neutral').first()
				if ch:
					uc_obj, _ = CU.objects.get_or_create(user=user, challenge=ch)
					uc_obj.completed = True
					uc_obj.completed_at = timezone.now()
					uc_obj.save()
			except Exception:
				pass

	except Exception:
		# Fail silently: awarding badges is best-effort and should not block activity creation
		pass
