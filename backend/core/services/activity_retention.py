from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from core.models import ActivityLog


RETENTION_TO_DAYS = {
    '7d': 7,
    '30d': 30,
    '365d': 365,
}


def get_retention_days(user) -> int:
    profile = getattr(user, 'profile', None)
    retention = getattr(profile, 'activity_retention', '30d') if profile else '30d'
    return RETENTION_TO_DAYS.get(retention, 30)


def apply_activity_retention(user) -> int:
    """
    Deletes outdated user activity logs according to the profile retention policy.
    Returns number of deleted rows.
    """
    if not user or user.is_anonymous:
        return 0

    days = get_retention_days(user)
    cutoff = timezone.now() - timedelta(days=days)
    deleted_count, _ = ActivityLog.objects.filter(user=user, created_at__lt=cutoff).delete()
    return deleted_count
