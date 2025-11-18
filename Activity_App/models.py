from django.db import models
from django.conf import settings


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
