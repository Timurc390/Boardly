from rest_framework import viewsets, permissions
from core.models import Checklist, ChecklistItem, Attachment, Comment
from core.api.serializers import ChecklistSerializer, ChecklistItemSerializer, AttachmentSerializer, CommentSerializer
from core.services.activity_logger import log_activity
from core.services.permissions import (
    ensure_card_edit,
    ensure_comment_create,
    ensure_comment_edit,
    ensure_comment_delete,
)

class ChecklistViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Checklist.objects.all().prefetch_related('items')
        card_id = self.request.query_params.get('card_id')
        if card_id:
            queryset = queryset.filter(card__id=card_id)
        return queryset

    def perform_create(self, serializer):
        card = serializer.validated_data.get('card')
        if card:
            ensure_card_edit(self.request.user, card, 'Only card members or admins can create checklists.')
        serializer.save()

    def perform_update(self, serializer):
        checklist = serializer.instance
        ensure_card_edit(self.request.user, checklist.card, 'Only card members or admins can update checklists.')
        serializer.save()

    def perform_destroy(self, instance):
        ensure_card_edit(self.request.user, instance.card, 'Only card members or admins can delete checklists.')
        instance.delete()

class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ChecklistItem.objects.select_related('checklist__card__list__board')

    def perform_create(self, serializer):
        checklist = serializer.validated_data.get('checklist')
        if checklist:
            ensure_card_edit(self.request.user, checklist.card, 'Only card members or admins can update checklist items.')
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
        item_instance = serializer.instance
        ensure_card_edit(self.request.user, item_instance.checklist.card, 'Only card members or admins can update checklist items.')
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

    def perform_create(self, serializer):
        card = serializer.validated_data.get('card')
        if card:
            ensure_card_edit(self.request.user, card, 'Only card members or admins can add attachments.')
        serializer.save()

    def perform_update(self, serializer):
        attachment = serializer.instance
        ensure_card_edit(self.request.user, attachment.card, 'Only card members or admins can update attachments.')
        serializer.save()

    def perform_destroy(self, instance):
        ensure_card_edit(self.request.user, instance.card, 'Only card members or admins can delete attachments.')
        instance.delete()

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
        card = serializer.validated_data.get('card')
        if card:
            ensure_comment_create(self.request.user, card, 'Only board members can add comments.')
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

    def perform_update(self, serializer):
        comment = serializer.instance
        ensure_comment_edit(self.request.user, comment, 'Only author or admins can edit comments.')
        serializer.save()

    def perform_destroy(self, instance):
        ensure_comment_delete(self.request.user, instance, 'Only admins can delete comments.')
        instance.delete()
