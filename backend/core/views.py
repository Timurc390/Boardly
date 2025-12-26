from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from .models import (
    Board, BoardMember, FavoriteBoard, List, Card, CardMember, Label, CardLabel, Checklist, ChecklistItem, Attachment, Comment, Activity
)
from .serializers import (
    UserSerializer, BoardSerializer, ListSerializer, CardSerializer, 
    LabelSerializer, ChecklistSerializer, ChecklistItemSerializer, 
    BoardMemberSerializer, FavoriteBoardSerializer, AttachmentSerializer, CommentSerializer, ActivitySerializer
)
from .permissions import IsOwnerOrReadOnly 

# ----------------------------------------------------------------------
# AUTHENTICATION & USER MANAGEMENT
# ----------------------------------------------------------------------

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для пользователей.
    Содержит action 'me' для получения и редактирования своего профиля.
    """
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Кастомный эндпоинт users/me/.
        Использует UserSerializer, который умеет сохранять профиль.
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # partial=True позволяет обновлять только часть полей
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
        queryset = Board.objects.filter(Q(owner=user) | Q(members=user)).distinct()
        query = self.request.query_params.get('q')
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

        
    # Кастомний ендпоінт для швидкого додавання до Обраних
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        board = self.get_object()
        board.is_favorite = not board.is_favorite
        board.save()
        return Response({'status': 'success', 'is_favorite': board.is_favorite})


class BoardMemberViewSet(viewsets.ModelViewSet):
    """
    Керування учасниками дошки (admin/member).
    """
    serializer_class = BoardMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        board_id = self.request.query_params.get('board_id')
        qs = BoardMember.objects.select_related('user', 'board')
        if board_id:
            return qs.filter(board_id=board_id)
        return qs.filter(user=self.request.user)

    def perform_create(self, serializer):
        board = get_object_or_404(Board, pk=self.request.data.get('board'))
        self._ensure_admin(board)
        serializer.save(board=board)

    def perform_update(self, serializer):
        self._ensure_admin(serializer.instance.board)
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_admin(instance.board)
        instance.delete()

    def _ensure_admin(self, board):
        is_admin = (
            board.owner_id == self.request.user.id
            or BoardMember.objects.filter(board=board, user=self.request.user, role='admin').exists()
        )
        if not is_admin:
            raise PermissionDenied("Тільки адмін може керувати учасниками.")


class FavoriteBoardViewSet(viewsets.ModelViewSet):
    """
    Обране/необране для дошок.
    """
    serializer_class = FavoriteBoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        board_id = self.request.query_params.get('board_id')
        qs = FavoriteBoard.objects.filter(user=self.request.user)
        if board_id:
            return qs.filter(board_id=board_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Оновлює порядок списків (drag & drop).
        Payload: [{id, order, board}]
        """
        items = request.data
        with transaction.atomic():
            for item in items:
                List.objects.filter(pk=item['id']).update(
                    order=item.get('order', 0),
                    board_id=item.get('board') or F('board')
                )
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        """
        Копіює список разом з картками.
        """
        src_list = self.get_object()
        new_title = request.data.get('title', f"{src_list.title} (копія)")
        new_order = request.data.get('order', src_list.order + 0.00001)

        with transaction.atomic():
            new_list = List.objects.create(
                board=src_list.board,
                title=new_title,
                order=new_order,
                is_archived=src_list.is_archived
            )
            for card in src_list.cards.all():
                card.pk = None
                card.list = new_list
                card.save()
        return Response(ListSerializer(new_list).data, status=201)

class CardViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій з Картками (Card)."""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Фільтруємо картки за list_id, board_id, пошуком та фільтрами."""
        queryset = Card.objects.all().prefetch_related(
            'members',
            'checklists__items',
            'attachments',
            'comments',
            'card_labels',
        )
        list_id = self.request.query_params.get('list_id')
        board_id = self.request.query_params.get('board_id') # Для загального пошуку/фільтрації
        query = self.request.query_params.get('q')
        member = self.request.query_params.get('member')
        label = self.request.query_params.get('label')
        due_from = self.request.query_params.get('due_from')
        due_to = self.request.query_params.get('due_to')

        if list_id:
            queryset = queryset.filter(list__id=list_id)
        elif board_id:
            queryset = queryset.filter(list__board__id=board_id)
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if member:
            queryset = queryset.filter(members__id=member)
        if label:
            queryset = queryset.filter(card_labels__label_id=label)
        if due_from and due_to:
            queryset = queryset.filter(due_date__range=[due_from, due_to])
        elif due_from:
            queryset = queryset.filter(due_date__gte=due_from)
        elif due_to:
            queryset = queryset.filter(due_date__lte=due_to)
            
        # У реальному проєкті потрібно додати перевірку доступу до Board
        return queryset.distinct()

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Оновлення порядку карток (drag&drop).
        Payload: [{id, order, list}]
        """
        items = request.data
        with transaction.atomic():
            for item in items:
                Card.objects.filter(pk=item['id']).update(
                    order=item.get('order', 0),
                    list_id=item.get('list') or F('list')
                )
        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        """
        Копіювання картки з мітками, учасниками та чек-листами.
        """
        src_card = self.get_object()
        new_title = request.data.get('title', f"{src_card.title} (копія)")
        # порядок: якщо не передано, беремо src.order + невеликий крок як Decimal
        from decimal import Decimal
        new_order = request.data.get('order')
        if new_order is None:
            new_order = src_card.order + Decimal('0.00001')

        with transaction.atomic():
            new_card = Card.objects.create(
                list=src_card.list,
                title=new_title,
                description=src_card.description,
                order=new_order,
                due_date=src_card.due_date,
                is_completed=src_card.is_completed,
                is_archived=src_card.is_archived,
            )
            new_card.members.set(src_card.members.all())
            new_card.card_labels.set(src_card.card_labels.all())
            for cl in src_card.checklists.all():
                new_cl = Checklist.objects.create(card=new_card, title=cl.title, order=getattr(cl, 'order', 0))
                for item in cl.items.all():
                    ChecklistItem.objects.create(
                        checklist=new_cl,
                        text=item.text,
                        is_checked=item.is_checked,
                        order=item.order,
                    )

        return Response(CardSerializer(new_card, context=self.get_serializer_context()).data, status=201)

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

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Оновлення порядку чек-листів.
        Payload: [{id, order}]
        """
        for item in request.data:
            Checklist.objects.filter(pk=item['id']).update(order=item.get('order', 0))
        return Response({'status': 'ok'})

class ChecklistItemViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операцій з Пунктами Чек-листа (ChecklistItem)."""
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ChecklistItem.objects.all() # Потрібно додати перевірку доступу

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Оновлення порядку пунктів чек-листа.
        Payload: [{id, order}]
        """
        for item in request.data:
            ChecklistItem.objects.filter(pk=item['id']).update(order=item.get('order', 0))
        return Response({'status': 'ok'})

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


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        card_id = self.request.query_params.get('card_id')
        qs = Attachment.objects.all()
        if card_id:
            qs = qs.filter(card_id=card_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        card_id = self.request.query_params.get('card_id')
        qs = Comment.objects.all().select_related('user')
        if card_id:
            qs = qs.filter(card_id=card_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
