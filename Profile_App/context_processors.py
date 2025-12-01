from .models import Profile


def profile(request):
    """Expose a `profile` variable to all templates for authenticated users.

    This centralizes avatar access so headers across the site can show the
    persisted avatar image when available.
    """
    if not request.user or not request.user.is_authenticated:
        return {}
    try:
        prof, _ = Profile.objects.get_or_create(user=request.user)
        return { 'profile': prof }
    except Exception:
        return {}
