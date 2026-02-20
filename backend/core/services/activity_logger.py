from core.models import ActivityLog
from core.services.activity_retention import apply_activity_retention

def log_activity(user, action, entity_type='', entity_id=None, meta=None):
    """
    Утиліта для запису дій користувача в історію.
    """
    if not user or user.is_anonymous:
        return
        
    ActivityLog.objects.create(
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        meta=meta or {}
    )
    apply_activity_retention(user)
