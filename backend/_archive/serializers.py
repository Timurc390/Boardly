from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from .models import (
    Profile, Board, Membership, List, Card, CardMember,
    Label, CardLabel, Checklist, ChecklistItem, Activity, Attachment, Comment, ActivityLog
)

# ----------------------------------------------------------------------
# 1. AUTH & PROFILE SERIALIZERS
# ----------------------------------------------------------------------

class UserCreateSerializer(DjoserUserCreateSerializer):
    class Meta(DjoserUserCreateSerializer.Meta):
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ('organization', 'theme', 'language', 'notify_email', 'avatar', 'avatar_url')

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор пользователя с поддержкой вложенного обновления профиля.
    """
    profile = ProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'profile')
        read_only_fields = ('username', 'email')

    def update(self, instance, validated_data):
        """
        Переопределяем метод update для сохранения вложенных данных профиля.
        """
        # Извлекаем данные профиля
        profile_data = validated_data.pop('profile', None)

        # Обновляем поля User (имя, фамилия)
        instance = super().update(instance, validated_data)

        # Обновляем поля Profile, если они были переданы
        if profile_data:
            # Получаем или создаем профиль (на случай если его почему-то нет)
            profile_instance, _ = Profile.objects.get_or_create(user=instance)
            
            # Обновляем поля профиля
            for attr, value in profile_data.items():
                setattr(profile_instance, attr, value)
            profile_instance.save()

        return instance
# ----------------------------------------------------------------------
# 2. СЕРІАЛІЗАТОРИ ДЕТАЛІЗАЦІЇ (Membership, Checklist, Label, Activity)
# ----------------------------------------------------------------------

class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)
    board_id = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all(), source='board', write_only=True)
    board = serializers.IntegerField(source='board_id', read_only=True)
    class Meta:
        model = Membership
        fields = ('id', 'user', 'user_id', 'board', 'board_id', 'role')

class ChecklistItemSerializer(serializers.ModelSerializer):
    checklist = serializers.PrimaryKeyRelatedField(queryset=Checklist.objects.all(), write_only=True)

    class Meta:
        model = ChecklistItem
        fields = ('id', 'checklist', 'text', 'is_checked', 'order')

class ChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)
    card = serializers.PrimaryKeyRelatedField(queryset=Card.objects.all(), write_only=True)
    class Meta:
        model = Checklist
        fields = ('id', 'card', 'title', 'items')

class LabelSerializer(serializers.ModelSerializer):
    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all(), write_only=True)

    class Meta:
        model = Label
        fields = ('id', 'board', 'name', 'color')

class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Activity
        fields = ('id', 'board', 'user', 'action_text', 'timestamp') # Додайте action_type, якщо він є в моделі
        read_only_fields = ('board', 'user', 'action_text', 'timestamp')

class ActivityLogSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='action', read_only=True)
    message = serializers.SerializerMethodField()
    board_id = serializers.SerializerMethodField()
    card_id = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ('id', 'action', 'type', 'message', 'entity_type', 'entity_id', 'meta', 'board_id', 'card_id', 'created_at')

    def get_message(self, obj):
        base = obj.action.replace('_', ' ').capitalize()
        title = obj.meta.get('title') if isinstance(obj.meta, dict) else None
        if title:
            return f'{base}: {title}'
        return base

    def get_board_id(self, obj):
        if isinstance(obj.meta, dict) and obj.meta.get('board_id'):
            return obj.meta.get('board_id')
        return None

    def get_card_id(self, obj):
        if isinstance(obj.meta, dict) and obj.meta.get('card_id'):
            return obj.meta.get('card_id')
        if obj.entity_type == 'card':
            return obj.entity_id
        return None


class BoardBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ('id', 'title', 'is_archived')


class ListBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ('id', 'title')

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ('id', 'card', 'file', 'uploaded_at')
        read_only_fields = ('uploaded_at',)

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ('id', 'card', 'author', 'text', 'created_at')
        read_only_fields = ('author', 'created_at')

# ----------------------------------------------------------------------
# 3. СЕРІАЛІЗАТОРИ КАРТОК, СПИСКІВ ТА ДОШОК
# ----------------------------------------------------------------------

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

    def update(self, instance, validated_data):
        label_ids = validated_data.pop('label_ids', None)
        card = super().update(instance, validated_data)
        if label_ids is not None:
            self._sync_labels(card, label_ids)
        return card

class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)
    class Meta:
        model = List
        fields = ('id', 'title', 'order', 'is_archived', 'board', 'cards')

class BoardSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = MembershipSerializer(source='membership_set', many=True, read_only=True)
    lists = ListSerializer(many=True, read_only=True)
    labels = LabelSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = (
            'id', 'title', 'description', 'background_url', 
            'is_archived', 'is_favorite', 'owner', 'created_at', 
            'invite_link', 'members', 'lists', 'labels'
        )
        read_only_fields = ('owner', 'invite_link', 'created_at')
