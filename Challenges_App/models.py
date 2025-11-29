from django.conf import settings
from django.db import models
from django.db.models import Sum


class Challenge(models.Model):
	# Optional machine-friendly key to map badges to challenges (e.g. 'eco_commuter')
	key = models.CharField(max_length=64, blank=True, null=True, db_index=True)
	title = models.CharField(max_length=200)
	description = models.TextField(blank=True)
	points = models.IntegerField(default=0)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.title} ({self.points} pts)"


class UserChallenge(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
	completed = models.BooleanField(default=False)
	completed_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		unique_together = ('user', 'challenge')

	def __str__(self):
		return f"{self.user} - {self.challenge} - {'done' if self.completed else 'open'}"



