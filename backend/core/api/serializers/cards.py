from rest_framework import serializers
from core.models import List, Card, CardLabel, Label
from .users import UserSerializer
from .details import ChecklistSerializer, AttachmentSerializer, CommentSerializer
from .boards import BoardBriefSerializer, LabelSerializer

class ListBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ('id', 'title')

class CardSerializer(serializers.ModelSerializer):
    due_date = serializers.DateTimeField(required=False, allow_null=True, input_formats=['%Y-%m-%d', 'iso-8601'])
    checklists = ChecklistSerializer(many=True, read_only=True)
    labels = serializers.SerializerMethodField()
    label_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    board = serializers.IntegerField(source='list.board_id', read_only=True)
    board_title = serializers.CharField(source='list.board.title', read_only=True)
    members = UserSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Card
        fields = (
            'id', 'title', 'description', 'card_color', 'order', 'due_date',
            'is_completed', 'is_archived', 'list', 'board', 'board_title',
            'members', 'labels', 'label_ids',
            'checklists', 'attachments', 'comments'
        )

    def get_labels(self, obj):
        labels = Label.objects.filter(cardlabel__card=obj)
        return LabelSerializer(labels, many=True).data

    def _sync_labels(self, card, label_ids):
        if label_ids is None:
            return
        label_ids = [int(label_id) for label_id in label_ids]
        CardLabel.objects.filter(card=card).exclude(label_id__in=label_ids).delete()
        existing = set(
            CardLabel.objects.filter(card=card, label_id__in=label_ids)
            .values_list('label_id', flat=True)
        )
        to_create = [CardLabel(card=card, label_id=label_id) for label_id in label_ids if label_id not in existing]
        if to_create:
            CardLabel.objects.bulk_create(to_create)

    def create(self, validated_data):
        label_ids = validated_data.pop('label_ids', [])
        card = super().create(validated_data)
        if label_ids:
            self._sync_labels(card, label_ids)
        return card
        
    def update(self, instance, validated_data):
        label_ids = validated_data.pop('label_ids', None)
        card = super().update(instance, validated_data)
        if label_ids is not None:
            self._sync_labels(card, label_ids)
        return card


class MyCardSerializer(serializers.ModelSerializer):
    board = BoardBriefSerializer(source='list.board', read_only=True)
    list = ListBriefSerializer(read_only=True)
    labels = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = ('id', 'title', 'description', 'card_color', 'due_date', 'is_archived', 'board', 'list', 'labels')

    def get_labels(self, obj):
        labels = Label.objects.filter(cardlabel__card=obj)
        return LabelSerializer(labels, many=True).data

class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)
    class Meta:
        model = List
        fields = ('id', 'title', 'order', 'is_archived', 'board', 'cards')