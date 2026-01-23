from rest_framework import permissions
from core.models import Membership

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Дозволяє редагування лише власнику об'єкта.
    Для інших - лише читання.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Перевірка на власника (атрибут owner)
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True

        # Специфічна логіка для адміністраторів дощок
        if request.method in ('PUT', 'PATCH') and hasattr(obj, 'board'):
            # Якщо об'єкт прив'язаний до дошки (наприклад, список)
            return Membership.objects.filter(board=obj.board, user=request.user, role='admin').exists()
            
        return False