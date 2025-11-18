from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'category', 'subtype', 'impact', 'date', 'created_at')
	list_filter = ('category', 'date')
	search_fields = ('user__username', 'subtype')
	readonly_fields = ('created_at',)
