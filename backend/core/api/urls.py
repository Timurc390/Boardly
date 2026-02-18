from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api.views import (
    UserViewSet, BoardViewSet, ListViewSet, CardViewSet,
    LabelViewSet, ChecklistViewSet, ChecklistItemViewSet, ActivityViewSet, ActivityLogViewSet,
    GoogleLogin, BoardMemberViewSet, FavoriteBoardViewSet,
    AttachmentViewSet, CommentViewSet, MyCardsViewSet
)

# Створюємо роутер і реєструємо всі ViewSet'и
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'board-members', BoardMemberViewSet, basename='board-member')
router.register(r'favorites', FavoriteBoardViewSet, basename='favorite-board')
router.register(r'lists', ListViewSet, basename='list')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'my-cards', MyCardsViewSet, basename='my-cards')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'checklists', ChecklistViewSet, basename='checklist')
router.register(r'checklist-items', ChecklistItemViewSet, basename='checklist-item')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'activity', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    # Всі маршрути з роутера
    path('', include(router.urls)),
    
    # Окремий маршрут для Google Login
    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
]
