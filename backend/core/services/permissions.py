from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
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

        # Адміни дошки можуть змінювати саму дошку (але не видаляти)
        if request.method in ('PUT', 'PATCH') and hasattr(obj, 'owner_id') and is_board_admin(request.user, obj):
            return True

        # Специфічна логіка для адміністраторів дощок
        if request.method in ('PUT', 'PATCH') and hasattr(obj, 'board'):
            # Якщо об'єкт прив'язаний до дошки (наприклад, список)
            return Membership.objects.filter(board=obj.board, user=request.user, role='admin').exists()
            
        return False


def is_board_admin(user, board) -> bool:
    if not user or user.is_anonymous or not board:
        return False
    if getattr(board, 'owner_id', None) == user.id:
        return True
    return Membership.objects.filter(board=board, user=user, role='admin').exists()


def ensure_board_admin(user, board, message='Only admins can perform this action.'):
    if is_board_admin(user, board):
        return True
    raise PermissionDenied(message)
