from rest_framework import permissions

from core.services.permissions import is_board_admin

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Кастомний дозвіл. Дозволяє повний доступ (запис/редагування) лише власнику об'єкта.
    Усім іншим дозволено лише читання (GET, HEAD, OPTIONS).
    """
    def has_object_permission(self, request, view, obj):
        # Дозволи на читання (GET, HEAD, OPTIONS) дозволені будь-якому запиту
        if request.method in permissions.SAFE_METHODS:
            return True

        # Дозволи на запис (PUT, POST, DELETE) дозволені лише власнику об'єкта
        if obj.owner == request.user:
            return True

        if request.method in ('PUT', 'PATCH'):
            return is_board_admin(request.user, obj)

        return False
