from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum

# import models lazily inside handlers to avoid circular imports at import time

@receiver(post_save, sender='Challenges_App.UserChallenge')
def handle_userchallenge_saved(sender, instance, **kwargs):
    try:
        from Dashboard_App.models import UserPoints
        # recompute total from completed UserChallenge rows
        user = instance.user
        from Challenges_App.models import UserChallenge as UC
        total = UC.objects.filter(user=user, completed=True).aggregate(total=Sum('challenge__points'))['total'] or 0
        up, _ = UserPoints.objects.get_or_create(user=user)
        up.total_points = int(total)
        up.save()
    except Exception:
        # best-effort: do not raise
        pass


@receiver(post_delete, sender='Challenges_App.UserChallenge')
def handle_userchallenge_deleted(sender, instance, **kwargs):
    try:
        from Dashboard_App.models import UserPoints
        user = instance.user
        from Challenges_App.models import UserChallenge as UC
        total = UC.objects.filter(user=user, completed=True).aggregate(total=Sum('challenge__points'))['total'] or 0
        up, _ = UserPoints.objects.get_or_create(user=user)
        up.total_points = int(total)
        up.save()
    except Exception:
        pass
