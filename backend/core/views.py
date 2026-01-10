from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import models
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView

from .models import (
    Board, List, Card, CardMember, Label, CardLabel, Checklist, ChecklistItem, Activity
)
from .serializers import (
    UserSerializer, BoardSerializer, ListSerializer, CardSerializer, 
    LabelSerializer, ChecklistSerializer, ChecklistItemSerializer, 
    MembershipSerializer, ActivitySerializer
)
from .permissions import IsOwnerOrReadOnly 

# ----------------------------------------------------------------------
# 1. СОЦІАЛЬНА АВТОРИЗАЦІЯ (Google)
# ----------------------------------------------------------------------

class GoogleLogin(SocialLoginView):
    """
    Ендпоінт для входу через Google.
    Приймає {'access_token': 'YOUR_GOOGLE_ID_TOKEN'}
    """
    adapter_class = GoogleOAuth2Adapter
    # client_class = OAuth2Client  <-- ЦЕЙ РЯДОК МАЄ БУТИ ЗАКОМЕНТОВАНИЙ АБО ВИДАЛЕНИЙ
    # callback_url також не потрібен для GSI flow, якщо ми не обмінюємо код

# ----------------------------------------------------------------------
# 2. УПРАВЛІННЯ КОРИСТУВАЧАМИ
# ----------------------------------------------------------------------

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для відображення всіх користувачів.
    """
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        """Ендпоїнт для отримання та оновлення даних поточного юзера."""
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Board.objects.none()
        return Board.objects.filter(Q(owner=user) | Q(members=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

        
    # Кастомний ендпоінт для швидкого додавання до Обраних
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        board = self.get_object()
        board.is_favorite = not board.is_favorite
        board.save()
        return Response({'status': 'success', 'is_favorite': board.is_favorite})


# ----------------------------------------------------------------------
# 3. СТРУКТУРНІ ЕЛЕМЕНТИ ДОШКИ (Списки, Картки, Мітки)
# ----------------------------------------------------------------------

class ListViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій зі Списками (List)."""
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        """Фільтруємо списки за board_id, переданим у запиті."""
        queryset = List.objects.all().prefetch_related('cards')
        board_id = self.request.query_params.get('board_id')
        if board_id:
            # Тут у реальному проєкті потрібно додати перевірку доступу до Board
            queryset = queryset.filter(board__id=board_id)
        return queryset

class CardViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій з Картками (Card)."""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо картки за list_id або board_id."""
        queryset = Card.objects.all().prefetch_related('members', 'checklists')
        list_id = self.request.query_params.get('list_id')
        board_id = self.request.query_params.get('board_id') # Для загального пошуку/фільтрації
        
        if list_id:
            queryset = queryset.filter(list__id=list_id)
        elif board_id:
            queryset = queryset.filter(list__board__id=board_id)
            
        # У реальному проєкті потрібно додати перевірку доступу до Board
        return queryset

class LabelViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій з Мітками (Label)."""
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо мітки за board_id."""
        queryset = Label.objects.all()
        board_id = self.request.query_params.get('board_id')
        if board_id:
            # У реальному проєкті потрібно додати перевірку доступу до Board
            queryset = queryset.filter(board__id=board_id)
        return queryset

# ----------------------------------------------------------------------
# 4. ДЕТАЛІЗАЦІЯ КАРТКИ ТА ЖУРНАЛ ДІЙ
# ----------------------------------------------------------------------


class ChecklistViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій з Чек-листами (Checklist)."""
    serializer_class = ChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо чек-листи за card_id."""
        queryset = Checklist.objects.all().prefetch_related('items')
        card_id = self.request.query_params.get('card_id')
        if card_id:
            # У реальному проєкті потрібно додати перевірку доступу до Card/Board
            queryset = queryset.filter(card__id=card_id)
        return queryset

class ChecklistItemViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій з Пунктами Чек-листа (ChecklistItem)."""
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ChecklistItem.objects.all() # Потрібно додати перевірку доступу

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для Журналу Дій. Тільки для читання.
    """
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо дії за board_id."""
        queryset = Activity.objects.all().select_related('user', 'board')
        board_id = self.request.query_params.get('board_id')
        if board_id:
            # У реальному проєкті потрібно додати перевірку доступу до Board
            queryset = queryset.filter(board__id=board_id)
        return queryset.order_by('-timestamp')