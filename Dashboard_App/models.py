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
