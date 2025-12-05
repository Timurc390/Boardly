from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    UserViewSet, BoardViewSet, ListViewSet, CardViewSet, 
    LabelViewSet, ChecklistViewSet, ChecklistItemViewSet, ActivityViewSet
)

# Використовуємо DefaultRouter для автоматичного створення URL маршрутів
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'lists', ListViewSet, basename='list') 
router.register(r'cards', CardViewSet, basename='card')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'checklists', ChecklistViewSet, basename='checklist')
router.register(r'checklist-items', ChecklistItemViewSet, basename='checklist-item')
router.register(r'activities', ActivityViewSet, basename='activity')


urlpatterns = [
    path('admin/', admin.site.urls),
    # Підключаємо маршрути Djoser (для реєстрації, логіну, зміни пароля)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')), # Ендпоінти для отримання/видалення токенів
    
    # Підключаємо маршрути DRF до головного API шляху
    path('api/', include(router.urls)),
    # Маршрути для аутентифікації DRF (можна використовувати для тестування)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]