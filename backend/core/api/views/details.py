from rest_framework import viewsets, permissions
from core.models import Checklist, ChecklistItem, Attachment, Comment
from core.api.serializers import ChecklistSerializer, ChecklistItemSerializer, AttachmentSerializer, CommentSerializer
from core.services.activity_logger import log_activity

class ChecklistViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Checklist.objects.all().prefetch_related('items')
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card__id=card_id)
        return queryset

class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ChecklistItem.objects.select_related('checklist__card__list__board')

    def perform_create(self, serializer):
        item = serializer.save()
        card = item.checklist.card
        log_activity(
            self.request.user,
            'add_checklist_item',
            'card',
            card.id,
            {
                'board_id': card.list.board_id if card.list_id else None,
                'board_title': card.list.board.title if card.list_id else None,
                'card_id': card.id,
                'title': card.title,
                'checklist_id': item.checklist_id,
                'checklist_title': item.checklist.title,
                'item_id': item.id,
                'item_text': item.text
            }
        )

    def perform_update(self, serializer):
        previous = serializer.instance
        prev_checked = previous.is_checked
        prev_text = previous.text
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
                    'board_title': card.list.board.title if card.list_id else None,
                    'card_id': card.id,
                    'title': card.title,
                    'checklist_id': item.checklist_id,
                    'checklist_title': item.checklist.title,
                    'item_id': item.id,
                    'item_text': item.text,
                    'is_checked': item.is_checked
                }
            )
        if 'text' in serializer.validated_data and item.text != prev_text:
            card = item.checklist.card
            log_activity(
                self.request.user,
                'update_checklist_item',
                'card',
                card.id,
                {
                    'board_id': card.list.board_id if card.list_id else None,
                    'board_title': card.list.board.title if card.list_id else None,
                    'card_id': card.id,
                    'title': card.title,
                    'checklist_id': item.checklist_id,
                    'checklist_title': item.checklist.title,
                    'item_id': item.id,
                    'item_text': item.text,
                    'item_text_prev': prev_text
                }
            )

class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Attachment.objects.all()
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card__id=card_id)
        return queryset

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Comment.objects.all().select_related('author')
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card__id=card_id)
        return queryset

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        card = comment.card
        log_activity(
            self.request.user,
            'add_comment',
            'card',
            card.id,
            {
                'board_id': card.list.board_id if card.list_id else None,
                'board_title': card.list.board.title if card.list_id else None,
                'card_id': card.id,
                'title': card.title,
                'comment_id': comment.id,
                'comment_text': comment.text
            }
        )
