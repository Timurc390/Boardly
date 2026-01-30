from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404

from core.models import Board, List, Membership, Label, Activity
from core.api.serializers import BoardSerializer, MembershipSerializer, LabelSerializer, ActivitySerializer
from core.services.activity_logger import log_activity
from core.services.permissions import IsOwnerOrReadOnly

class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    # За замовчуванням залишаємо суворі права
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_permissions(self):
        """
        Динамічне визначення прав доступу залежно від дії.
        """
        if self.action in ['favorite', 'join', 'leave']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Board.objects.none()
        return Board.objects.filter(Q(owner=user) | Q(members=user)).distinct()

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        # Створюємо членство для власника
        Membership.objects.create(user=self.request.user, board=board, role='admin')
        
        List.objects.bulk_create([
            List(title='To Do', board=board, order=1),
            List(title='In Progress', board=board, order=2),
            List(title='Done', board=board, order=3),
        ])
        log_activity(self.request.user, 'create_board', 'board', board.id, {
            'title': board.title,
            'board_id': board.id,
            'board_title': board.title
        })

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_archived = previous.is_archived
        prev_title = previous.title
        board = serializer.save()

        if 'is_archived' in serializer.validated_data and board.is_archived != prev_archived:
            action = 'archive_board' if board.is_archived else 'unarchive_board'
            log_activity(self.request.user, action, 'board', board.id, {
                'title': board.title,
                'board_id': board.id,
                'board_title': board.title
            })
        elif 'title' in serializer.validated_data or 'background_url' in serializer.validated_data:
            if board.title != prev_title:
                log_activity(self.request.user, 'rename_board', 'board', board.id, {
                    'title': board.title,
                    'board_id': board.id,
                    'board_title': board.title
                })
            else:
                log_activity(self.request.user, 'update_board', 'board', board.id, {
                    'board_id': board.id,
                    'board_title': board.title
                })

    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        board = self.get_object()
        membership, created = Membership.objects.get_or_create(user=request.user, board=board)
        membership.is_favorite = not membership.is_favorite
        membership.save()
        return Response({'status': 'success', 'is_favorite': membership.is_favorite})

    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
        invite_link = request.data.get('invite_link')
        if not invite_link:
            return Response({'detail': 'invite_link_required'}, status=400)
        board = get_object_or_404(Board, invite_link=invite_link)
        
        if Membership.objects.filter(board=board, user=request.user).exists():
             return Response({'detail': 'already_member'}, status=400)

        Membership.objects.create(board=board, user=request.user, role='member')
        serializer = self.get_serializer(board)
        return Response(serializer.data)

class FavoriteBoardViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Board.objects.none()
        return Board.objects.filter(membership__user=user, membership__is_favorite=True).distinct()

# --- ВИПРАВЛЕНИЙ BOARD MEMBER VIEWSET ---
class BoardMemberViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Показуємо тільки учасників тих дошок, до яких користувач має доступ.
        """
        user = self.request.user
        if user.is_anonymous:
            return Membership.objects.none()
            
        # Запит: Всі мембершипи, які належать дошкам, де поточний юзер є власником АБО учасником
        # Використовуємо distinct(), щоб уникнути дублів
        accessible_boards = Board.objects.filter(Q(owner=user) | Q(members=user))
        return Membership.objects.filter(board__in=accessible_boards).select_related('user', 'board')

    def perform_create(self, serializer):
        # Додавання учасника вручну (через API, а не через Join Link)
        board = serializer.validated_data['board']
        user = self.request.user
        
        # Перевірка прав: Тільки Адмін або Власник можуть додавати
        is_owner = (board.owner_id == user.id)
        is_admin = Membership.objects.filter(board=board, user=user, role='admin').exists()
        
        if not (is_owner or is_admin):
            raise PermissionDenied('Only admins can add members directly.')
            
        serializer.save()

    def perform_update(self, serializer):
        # Зміна ролі учасника
        instance = serializer.instance
        board = instance.board
        user = self.request.user
        
        # Перевірка прав: Тільки Адмін або Власник можуть змінювати ролі
        is_owner = (board.owner_id == user.id)
        is_admin = Membership.objects.filter(board=board, user=user, role='admin').exists()
        
        if not (is_owner or is_admin):
            raise PermissionDenied('Only admins can change roles.')
            
        # Не можна змінювати роль Власника
        if instance.user_id == board.owner_id:
            raise PermissionDenied('Cannot change owner role.')
            
        serializer.save()

    def perform_destroy(self, instance):
        """
        Видалення учасника.
        Логіка:
        1. Користувач може видалити САМ СЕБЕ (Leave Board).
        2. Адмін/Власник може видалити ІНШИХ.
        """
        user = self.request.user
        board = instance.board
        
        # Сценарій 1: Користувач виходить сам
        if instance.user_id == user.id:
            if board.owner_id == user.id:
                raise PermissionDenied('Owner cannot leave board. Transfer ownership first.')
            instance.delete()
            return

        # Сценарій 2: Видалення іншого користувача
        is_owner = (board.owner_id == user.id)
        is_admin = Membership.objects.filter(board=board, user=user, role='admin').exists()
        
        if not (is_owner or is_admin):
            raise PermissionDenied('You do not have permission to remove members.')
            
        if instance.user_id == board.owner_id:
            raise PermissionDenied('Cannot remove board owner.')
            
        instance.delete()

class LabelViewSet(viewsets.ModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Label.objects.all()
        board_id = self.request.query_params.get('board_id')
        if board_id:
            queryset = queryset.filter(board__id=board_id)
        return queryset

    def perform_create(self, serializer):
        label = serializer.save()
        log_activity(self.request.user, 'create_label', 'label', label.id, {
            'label_id': label.id,
            'label_name': label.name,
            'board_id': label.board_id,
            'board_title': label.board.title
        })

    def perform_update(self, serializer):
        label = serializer.save()
        log_activity(self.request.user, 'update_label', 'label', label.id, {
            'label_id': label.id,
            'label_name': label.name,
            'board_id': label.board_id,
            'board_title': label.board.title
        })

    def perform_destroy(self, instance):
        meta = {
            'label_id': instance.id,
            'label_name': instance.name,
            'board_id': instance.board_id,
            'board_title': instance.board.title
        }
        instance.delete()
        log_activity(self.request.user, 'delete_label', 'label', meta['label_id'], meta)

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Activity.objects.all().select_related('user', 'board')
        board_id = self.request.query_params.get('board_id')
        if board_id:
            queryset = queryset.filter(board__id=board_id)
        return queryset.order_by('-timestamp')
