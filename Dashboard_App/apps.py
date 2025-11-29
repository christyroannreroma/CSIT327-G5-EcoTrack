from django.apps import AppConfig


class DashboardAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Dashboard_App'

    def ready(self):
        # Import signal handlers to ensure they are registered when the app is ready
        try:
            import Dashboard_App.signals  # noqa: F401
        except Exception:
            # Swallow import errors to avoid breaking startup; signals are best-effort
            pass
