from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.contrib.auth.models import User
from django.db import models
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from django.db.models import Q
from django.utils.dateparse import parse_date, parse_datetime

# Додаємо Attachment та Comment у імпорт моделей
from .models import (
    Board, List, Card, CardMember, Label, CardLabel, Checklist, ChecklistItem, Activity, Membership, Attachment, Comment, ActivityLog, Profile
)
# Додаємо AttachmentSerializer та CommentSerializer у імпорт серіалізаторів
from .serializers import (
    UserSerializer, BoardSerializer, ListSerializer, CardSerializer, 
    LabelSerializer, ChecklistSerializer, ChecklistItemSerializer, 
    MembershipSerializer, ActivitySerializer, AttachmentSerializer, CommentSerializer, ActivityLogSerializer, MyCardSerializer
)
from .permissions import IsOwnerOrReadOnly 


def log_activity(user, action, entity_type='', entity_id=None, meta=None):
    if not user or user.is_anonymous:
        return
    ActivityLog.objects.create(
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        meta=meta or {}
    )


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
            log_activity(request.user, 'update_profile', 'profile', request.user.id)
            return Response(serializer.data)

    @action(detail=False, methods=['post', 'delete'], url_path='me/avatar')
    def avatar(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if request.method == 'POST':
            avatar = request.FILES.get('avatar')
            if not avatar:
                return Response({'detail': 'avatar_required'}, status=400)
            profile.avatar = avatar
            profile.save()
            log_activity(request.user, 'update_avatar', 'profile', request.user.id)
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)

        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = None
        profile.save()
        log_activity(request.user, 'remove_avatar', 'profile', request.user.id)
        serializer = self.get_serializer(request.user)
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
        board = serializer.save(owner=self.request.user)
        List.objects.bulk_create([
            List(title='To Do', board=board, order=1),
            List(title='In Progress', board=board, order=2),
            List(title='Done', board=board, order=3),
        ])
        log_activity(self.request.user, 'create_board', 'board', board.id, {'title': board.title, 'board_id': board.id})

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_archived = previous.is_archived
        prev_title = previous.title
        board = serializer.save()

        if 'is_archived' in serializer.validated_data and board.is_archived != prev_archived:
            action = 'archive_board' if board.is_archived else 'unarchive_board'
            log_activity(self.request.user, action, 'board', board.id, {'title': board.title, 'board_id': board.id})
        elif 'title' in serializer.validated_data or 'background_url' in serializer.validated_data:
            if board.title != prev_title:
                log_activity(self.request.user, 'rename_board', 'board', board.id, {'title': board.title, 'board_id': board.id})
            else:
                log_activity(self.request.user, 'update_board', 'board', board.id, {'board_id': board.id})

        
    # Кастомний ендпоінт для швидкого додавання до Обраних
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        board = self.get_object()
        board.is_favorite = not board.is_favorite
        board.save()
        return Response({'status': 'success', 'is_favorite': board.is_favorite})

class FavoriteBoardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для отримання списку обраних дошок поточного користувача.
    """
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Board.objects.none()
        # Повертаємо дошки, де юзер є власником або учасником, І які позначені як обрані
        return Board.objects.filter(
            (Q(owner=user) | Q(members=user)) & Q(is_favorite=True)
        ).distinct()


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

    def perform_create(self, serializer):
        list_obj = serializer.save()
        log_activity(self.request.user, 'create_list', 'list', list_obj.id, {'board_id': list_obj.board_id, 'title': list_obj.title})

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_title = previous.title
        prev_archived = previous.is_archived
        prev_order = previous.order
        list_obj = serializer.save()

        if 'is_archived' in serializer.validated_data and list_obj.is_archived != prev_archived:
            action = 'archive_list' if list_obj.is_archived else 'unarchive_list'
            log_activity(self.request.user, action, 'list', list_obj.id, {'board_id': list_obj.board_id})
        elif 'title' in serializer.validated_data and list_obj.title != prev_title:
            log_activity(self.request.user, 'rename_list', 'list', list_obj.id, {'title': list_obj.title, 'board_id': list_obj.board_id})
        elif 'order' in serializer.validated_data and list_obj.order != prev_order:
            log_activity(self.request.user, 'move_list', 'list', list_obj.id, {'board_id': list_obj.board_id})

class CardViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операц?й з Картками (Card)."""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Ф?льтруємо картки за list_id або board_id."""
        queryset = Card.objects.all().select_related('list', 'list__board').prefetch_related(
            'members', 'checklists__items', 'cardlabel_set__label'
        )
        list_id = self.request.query_params.get('list_id')
        board_id = self.request.query_params.get('board_id') # Для загального пошуку/ф?льтрац?ї
        assigned = self.request.query_params.get('assigned')
        member = self.request.query_params.get('member')
        label = self.request.query_params.get('label')
        query = self.request.query_params.get('q')
        due_before = self.request.query_params.get('due_before')
        due_after = self.request.query_params.get('due_after')
        
        if list_id:
            queryset = queryset.filter(list__id=list_id)
        elif board_id:
            queryset = queryset.filter(list__board__id=board_id)

        if assigned == 'me':
            queryset = queryset.filter(members=self.request.user)
        elif member:
            queryset = queryset.filter(members__id=member)

        if label:
            queryset = queryset.filter(cardlabel__label_id=label)

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))

        if due_before:
            parsed_datetime = parse_datetime(due_before)
            if parsed_datetime:
                queryset = queryset.filter(due_date__lte=parsed_datetime)
            else:
                parsed_date = parse_date(due_before)
                if parsed_date:
                    queryset = queryset.filter(due_date__date__lte=parsed_date)

        if due_after:
            parsed_datetime = parse_datetime(due_after)
            if parsed_datetime:
                queryset = queryset.filter(due_date__gte=parsed_datetime)
            else:
                parsed_date = parse_date(due_after)
                if parsed_date:
                    queryset = queryset.filter(due_date__date__gte=parsed_date)
            
        # У реальному проєкт? потр?бно додати перев?рку доступу до Board
        return queryset

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_list_id = previous.list_id
        prev_archived = previous.is_archived
        prev_description = previous.description
        prev_due_date = previous.due_date
        card = serializer.save()
        board_id = card.list.board_id if card.list_id else None

        if 'list' in serializer.validated_data and card.list_id != prev_list_id:
            log_activity(self.request.user, 'move_card', 'card', card.id, {
                'from_list': prev_list_id,
                'to_list': card.list_id,
                'board_id': board_id,
                'card_id': card.id,
                'title': card.title
            })
        elif 'is_archived' in serializer.validated_data and card.is_archived != prev_archived:
            action = 'archive_card' if card.is_archived else 'unarchive_card'
            log_activity(self.request.user, action, 'card', card.id, {'list': card.list_id, 'board_id': board_id, 'card_id': card.id, 'title': card.title})
        else:
            if 'description' in serializer.validated_data and card.description != prev_description:
                log_activity(self.request.user, 'update_card_description', 'card', card.id, {'board_id': board_id, 'card_id': card.id, 'title': card.title})
            if 'due_date' in serializer.validated_data and card.due_date != prev_due_date:
                log_activity(self.request.user, 'update_card_due_date', 'card', card.id, {'board_id': board_id, 'card_id': card.id, 'title': card.title})
            if serializer.validated_data and not ('description' in serializer.validated_data or 'due_date' in serializer.validated_data):
                log_activity(self.request.user, 'update_card', 'card', card.id, {'board_id': board_id, 'card_id': card.id, 'title': card.title})

    def perform_create(self, serializer):
        card = serializer.save()
        CardMember.objects.get_or_create(card=card, user=self.request.user)
        board_id = card.list.board_id if card.list_id else None
        log_activity(self.request.user, 'create_card', 'card', card.id, {'list': card.list_id, 'board_id': board_id, 'card_id': card.id, 'title': card.title})

    @action(detail=False, methods=['get'], url_path='my-cards')
    def my_cards(self, request):
        queryset = self.get_queryset().filter(members=request.user)
        serializer = MyCardSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class MyCardsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MyCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Card.objects.none()
        return Card.objects.filter(
            Q(members=user)
        ).select_related('list', 'list__board').prefetch_related('cardlabel_set__label').distinct()

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
    queryset = ChecklistItem.objects.select_related('checklist__card__list__board')

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_checked = previous.is_checked
        item = serializer.save()
        if 'is_checked' in serializer.validated_data and item.is_checked != prev_checked:
            card = item.checklist.card
            log_activity(
                self.request.user,
                'toggle_checklist_item',
                'card',
                card.id,
                {
                    'board_id': card.list.board_id if card.list_id else None,
                    'card_id': card.id,
                    'title': card.title,
                    'checklist_id': item.checklist_id,
                    'item_id': item.id,
                    'item_text': item.text
                }
            )


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

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user).order_by('-created_at')

# ----------------------------------------------------------------------
# 5. УЧАСНИКИ ДОШКИ (НОВЕ)
# ----------------------------------------------------------------------

class BoardMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управління учасниками дошки (Membership).
    Дозволяє додавати користувачів до дошки, змінювати їх ролі або видаляти.
    """
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо учасників за board_id."""
        queryset = Membership.objects.all().select_related('user', 'board')
        board_id = self.request.query_params.get('board_id')
        if board_id:
            queryset = queryset.filter(board__id=board_id)
        return queryset

class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управління вкладеннями (Attachment).
    """
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо вкладення за card_id."""
        queryset = Attachment.objects.all()
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card__id=card_id)
        return queryset


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управління коментарями.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо коментарі за card_id."""
        queryset = Comment.objects.all().select_related('author')
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card__id=card_id)
        return queryset

    def perform_create(self, serializer):
        # Автоматично призначаємо автора коментаря
        serializer.save(author=self.request.user)
