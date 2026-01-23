from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils.dateparse import parse_date, parse_datetime

from core.models import List, Card, CardMember
from core.api.serializers import ListSerializer, CardSerializer, MyCardSerializer
from core.services.activity_logger import log_activity

class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
        queryset = List.objects.all().prefetch_related('cards')
        board_id = self.request.query_params.get('board_id')
        if board_id:
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