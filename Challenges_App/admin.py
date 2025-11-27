from django.contrib import admin
from .models import Challenge, UserChallenge


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
	list_display = ('title', 'key', 'points', 'is_active', 'created_at')
	list_filter = ('is_active',)
	search_fields = ('title', 'description', 'key')


@admin.register(UserChallenge)
class UserChallengeAdmin(admin.ModelAdmin):
	list_display = ('user', 'challenge', 'completed', 'completed_at')
	list_filter = ('completed',)
	search_fields = ('user__username', 'challenge__title')
