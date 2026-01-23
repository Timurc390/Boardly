from core.models import ActivityLog

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