from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.db import transaction
from django.utils.dateparse import parse_date, parse_datetime

# Додані імпорти для копіювання та перевірки прав
from core.models import List, Card, CardMember, Checklist, ChecklistItem, CardLabel, Membership, Label
from core.api.serializers import ListSerializer, CardSerializer, MyCardSerializer
from core.services.activity_logger import log_activity
from core.services.permissions import ensure_board_admin

class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        queryset = List.objects.all().prefetch_related('cards')
        board_id = self.request.query_params.get('board') # Виправлено board_id на board для фільтрації, якщо треба
        if board_id:
            queryset = queryset.filter(board__id=board_id)
        return queryset

    def perform_create(self, serializer):
        board = serializer.validated_data.get('board')
        ensure_board_admin(self.request.user, board, 'Only admins can create lists.')
        list_obj = serializer.save()
        log_activity(self.request.user, 'create_list', 'list', list_obj.id, {
            'board_id': list_obj.board_id,
            'board_title': list_obj.board.title if list_obj.board_id else None,
            'title': list_obj.title
        })

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_title = previous.title
        prev_archived = previous.is_archived
        prev_order = previous.order
        ensure_board_admin(self.request.user, previous.board, 'Only admins can update lists.')
        list_obj = serializer.save()

        if 'is_archived' in serializer.validated_data and list_obj.is_archived != prev_archived:
            action = 'archive_list' if list_obj.is_archived else 'unarchive_list'
            log_activity(self.request.user, action, 'list', list_obj.id, {
                'board_id': list_obj.board_id,
                'board_title': list_obj.board.title if list_obj.board_id else None,
                'title': list_obj.title
            })
        elif 'title' in serializer.validated_data and list_obj.title != prev_title:
            log_activity(self.request.user, 'rename_list', 'list', list_obj.id, {
                'title': list_obj.title,
                'board_id': list_obj.board_id,
                'board_title': list_obj.board.title if list_obj.board_id else None
            })
        elif 'order' in serializer.validated_data and list_obj.order != prev_order:
            log_activity(self.request.user, 'move_list', 'list', list_obj.id, {
                'board_id': list_obj.board_id,
                'board_title': list_obj.board.title if list_obj.board_id else None,
                'title': list_obj.title
            })

    # --- НОВЕ: Копіювання списку ---
    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        original_list = self.get_object()
        ensure_board_admin(request.user, original_list.board, 'Only admins can copy lists.')
        new_title = request.data.get('title', f"{original_list.title} (Копія)")
        
        with transaction.atomic():
            # 1. Копіюємо сам список
            new_list = List.objects.create(
                board=original_list.board,
                title=new_title,
                order=original_list.order + 1,
                color=original_list.color
            )
            
            # 2. Копіюємо всі активні картки
            original_cards = original_list.cards.filter(is_archived=False)
            for card in original_cards:
                new_card = Card.objects.create(
                    list=new_list,
                    title=card.title,
                    description=card.description,
                    card_color=card.card_color,
                    cover_size=card.cover_size,
                    order=card.order,
                    due_date=card.due_date,
                    is_completed=card.is_completed,
                    is_public=card.is_public
                )
                
                # Копіюємо мітки
                for card_label in CardLabel.objects.filter(card=card):
                    CardLabel.objects.create(card=new_card, label=card_label.label)
                
                # Копіюємо чеклисти
                for checklist in card.checklists.all():
                    new_checklist = Checklist.objects.create(card=new_card, title=checklist.title)
                    for item in checklist.items.all():
                        ChecklistItem.objects.create(
                            checklist=new_checklist, text=item.text, is_checked=item.is_checked, order=item.order
                        )

            log_activity(request.user, 'copy_list', 'list', new_list.id, {
                'board_id': new_list.board_id,
                'board_title': new_list.board.title,
                'original_id': pk,
                'title': new_list.title
            })
            return Response(ListSerializer(new_list).data)

    def perform_destroy(self, instance):
        ensure_board_admin(self.request.user, instance.board, 'Only admins can delete lists.')
        instance.delete()

class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Card.objects.all().select_related('list', 'list__board').prefetch_related(
            'members', 'checklists__items', 'cardlabel_set__label'
        )
        list_id = self.request.query_params.get('list_id')
        board_id = self.request.query_params.get('board_id')
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
            
        return queryset

    # --- НОВЕ: Перевірка прав ---
    def _has_card_permission(self, card, user):
        board = card.list.board
        # Власник або Адмін дошки
        if board.owner_id == user.id:
            return True
        if Membership.objects.filter(board=board, user=user, role='admin').exists():
            return True
        return False

    def perform_create(self, serializer):
        list_obj = serializer.validated_data.get('list')
        if list_obj:
            ensure_board_admin(self.request.user, list_obj.board, 'Only admins can create cards.')
        card = serializer.save()
        Checklist.objects.get_or_create(card=card, title='Чек-лист')
        # Авто-призначаємо автора на картку, щоб "Мої картки" не були порожні.
        CardMember.objects.get_or_create(card=card, user=self.request.user)
        board_id = card.list.board_id if card.list_id else None
        log_activity(self.request.user, 'create_card', 'card', card.id, {
            'list': card.list_id,
            'list_title': card.list.title if card.list_id else None,
            'board_id': board_id,
            'board_title': card.list.board.title if card.list_id else None,
            'card_id': card.id,
            'title': card.title
        })

    def perform_update(self, serializer):
        card_instance = serializer.instance
        ensure_board_admin(self.request.user, card_instance.list.board, 'Only admins can update cards.')
        card = serializer.instance

        previous = serializer.instance
        prev_list_id = previous.list_id
        prev_archived = previous.is_archived
        prev_description = previous.description
        prev_due_date = previous.due_date
        prev_completed = previous.is_completed
        prev_label_ids = set(CardLabel.objects.filter(card=previous).values_list('label_id', flat=True))
        
        card = serializer.save()
        board_id = card.list.board_id if card.list_id else None
        board_title = card.list.board.title if card.list_id else None

        # --- Логування ---
        if 'list' in serializer.validated_data and card.list_id != prev_list_id:
            from_list = List.objects.filter(id=prev_list_id).first()
            log_activity(self.request.user, 'move_card', 'card', card.id, {
                'from_list': prev_list_id,
                'to_list': card.list_id,
                'from_list_title': from_list.title if from_list else None,
                'to_list_title': card.list.title if card.list_id else None,
                'board_id': board_id,
                'board_title': board_title,
                'card_id': card.id,
                'title': card.title
            })
        elif 'is_archived' in serializer.validated_data and card.is_archived != prev_archived:
            action = 'archive_card' if card.is_archived else 'unarchive_card'
            log_activity(self.request.user, action, 'card', card.id, {
                'list': card.list_id,
                'list_title': card.list.title if card.list_id else None,
                'board_id': board_id,
                'board_title': board_title,
                'card_id': card.id,
                'title': card.title
            })
        else:
            if 'is_completed' in serializer.validated_data and card.is_completed != prev_completed:
                action = 'complete_card' if card.is_completed else 'uncomplete_card'
                log_activity(self.request.user, action, 'card', card.id, {
                    'board_id': board_id,
                    'board_title': board_title,
                    'card_id': card.id,
                    'title': card.title
                })
            if 'description' in serializer.validated_data and card.description != prev_description:
                log_activity(self.request.user, 'update_card_description', 'card', card.id, {
                    'board_id': board_id,
                    'board_title': board_title,
                    'card_id': card.id,
                    'title': card.title
                })
            if 'due_date' in serializer.validated_data and card.due_date != prev_due_date:
                log_activity(self.request.user, 'update_card_due_date', 'card', card.id, {
                    'board_id': board_id,
                    'board_title': board_title,
                    'card_id': card.id,
                    'title': card.title,
                    'due_before': prev_due_date.isoformat() if prev_due_date else None,
                    'due_after': card.due_date.isoformat() if card.due_date else None
                })
            if 'label_ids' in serializer.validated_data:
                new_label_ids = set(CardLabel.objects.filter(card=card).values_list('label_id', flat=True))
                added_ids = new_label_ids - prev_label_ids
                removed_ids = prev_label_ids - new_label_ids
                if added_ids or removed_ids:
                    added_labels = list(Label.objects.filter(id__in=added_ids).values_list('name', flat=True))
                    removed_labels = list(Label.objects.filter(id__in=removed_ids).values_list('name', flat=True))
                    log_activity(self.request.user, 'update_card_labels', 'card', card.id, {
                        'board_id': board_id,
                        'board_title': board_title,
                        'card_id': card.id,
                        'title': card.title,
                        'added_labels': added_labels,
                        'removed_labels': removed_labels
                    })
            if serializer.validated_data:
                log_activity(self.request.user, 'update_card', 'card', card.id, {
                    'board_id': board_id,
                    'board_title': board_title,
                    'card_id': card.id,
                    'title': card.title
                })

    def perform_destroy(self, instance):
        # Забороняємо видалення без прав
        ensure_board_admin(self.request.user, instance.list.board, 'Only admins can delete cards.')
        instance.delete()

    # --- НОВІ ACTIONS ---

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        card = self.get_object()
        ensure_board_admin(request.user, card.list.board, 'Only admins can manage card members.')
        CardMember.objects.get_or_create(card=card, user=request.user)
        return Response(CardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        card = self.get_object()
        ensure_board_admin(request.user, card.list.board, 'Only admins can manage card members.')
        CardMember.objects.filter(card=card, user=request.user).delete()
        return Response(CardSerializer(card).data)

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        card = self.get_object()
        ensure_board_admin(request.user, card.list.board, 'Only admins can remove card members.')

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id_required'}, status=400)

        CardMember.objects.filter(card=card, user_id=user_id).delete()
        return Response(CardSerializer(card).data)

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        card = self.get_object()
        ensure_board_admin(request.user, card.list.board, 'Only admins can manage card members.')

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id_required'}, status=400)

        CardMember.objects.get_or_create(card=card, user_id=user_id)
        return Response(CardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def toggle_public(self, request, pk=None):
        card = self.get_object()
        ensure_board_admin(request.user, card.list.board, 'Only admins can change card visibility.')
            
        card.is_public = not card.is_public
        card.save()
        return Response(CardSerializer(card).data)

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        original_card = self.get_object()
        target_list_id = request.data.get('list_id', original_card.list_id)
        new_title = request.data.get('title', f"{original_card.title} (Копія)")
        target_list = List.objects.get(id=target_list_id)
        ensure_board_admin(request.user, target_list.board, 'Only admins can copy cards.')
        
        with transaction.atomic():
            new_card = Card.objects.create(
                list=target_list,
                title=new_title,
                description=original_card.description,
                card_color=original_card.card_color,
                cover_size=original_card.cover_size,
                order=original_card.order + 1,
                due_date=original_card.due_date,
                is_public=original_card.is_public
            )
            
            for card_label in CardLabel.objects.filter(card=original_card):
                CardLabel.objects.create(card=new_card, label=card_label.label)
                
            for checklist in original_card.checklists.all():
                new_checklist = Checklist.objects.create(card=new_card, title=checklist.title)
                for item in checklist.items.all():
                    ChecklistItem.objects.create(
                        checklist=new_checklist, text=item.text, is_checked=item.is_checked, order=item.order
                    )
            
            log_activity(request.user, 'copy_card', 'card', new_card.id, {
                'board_id': target_list.board_id,
                'board_title': target_list.board.title,
                'original_id': pk,
                'original_title': original_card.title,
                'card_id': new_card.id,
                'title': new_card.title,
                'to_list': target_list.id,
                'to_list_title': target_list.title
            })
            return Response(CardSerializer(new_card).data)

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
