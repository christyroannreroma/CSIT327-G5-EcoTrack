from django.db import models
from django.conf import settings
from django.utils import timezone


class UserBadge(models.Model):
	"""Record that a user has earned a specific badge permanently."""
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges')
	key = models.CharField(max_length=64)  # e.g. 'eco_commuter'
	earned_at = models.DateTimeField(default=timezone.now)

	class Meta:
		unique_together = ('user', 'key')
		ordering = ['-earned_at']

	def __str__(self):
		return f"{self.user} - {self.key}"


class UserPoints(models.Model):
	"""Store an authoritative, persisted points total for a user.

	Kept in sync with completed `UserChallenge` rows via signals so the
	application can read a single field instead of aggregating frequently.
	"""
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='points')
	total_points = models.IntegerField(default=0)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-updated_at']

	def __str__(self):
		return f"{self.user} - {self.total_points} pts"
