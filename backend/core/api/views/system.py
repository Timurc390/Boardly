from __future__ import annotations

from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView


def _check_database() -> tuple[bool, str | None]:
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        return True, None
    except Exception as exc:
        return False, str(exc)


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        db_ok, db_error = _check_database()
        status_code = 200 if db_ok else 503

        payload = {
            'status': 'ok' if db_ok else 'degraded',
            'timestamp': timezone.now().isoformat(),
            'services': {
                'database': 'ok' if db_ok else 'error',
                'redis': 'configured' if getattr(settings, 'CHANNEL_REDIS_URL', '') else 'not_configured',
                'sentry': 'enabled' if getattr(settings, 'SENTRY_DSN', '') else 'disabled',
            },
        }
        if db_error:
            payload['errors'] = {'database': db_error}
        return Response(payload, status=status_code)
