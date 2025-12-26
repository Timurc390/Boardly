from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from .models import (
    Profile, Board, BoardMember, FavoriteBoard, List, Card, CardMember,
    Label, CardLabel, Checklist, ChecklistItem, Attachment, Comment, Activity
)

# ----------------------------------------------------------------------
# 1. AUTH & PROFILE SERIALIZERS
# ----------------------------------------------------------------------

class UserCreateSerializer(DjoserUserCreateSerializer):
    class Meta(DjoserUserCreateSerializer.Meta):
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('organization', 'theme')

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
# 2. СЕРІАЛІЗАТОРИ ДЕТАЛІЗАЦІЇ (BoardMember, Checklist, Label, Activity)
# ----------------------------------------------------------------------

class BoardMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)

    class Meta:
        model = BoardMember
        fields = ('id', 'user', 'user_id', 'board', 'role')
        read_only_fields = ('board',)

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ('id', 'text', 'is_checked', 'order', 'checklist')

class ChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)
    class Meta:
        model = Checklist
        fields = ('id', 'title', 'order', 'card', 'items')

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ('id', 'name', 'color')

class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Activity
        fields = ('id', 'board', 'user', 'action_text', 'timestamp') # Додайте action_type, якщо він є в моделі
        read_only_fields = ('board', 'user', 'action_text', 'timestamp')

# ----------------------------------------------------------------------
# 3. СЕРІАЛІЗАТОРИ КАРТОК, СПИСКІВ ТА ДОШОК
# ----------------------------------------------------------------------

class CardSerializer(serializers.ModelSerializer):
    checklists = ChecklistSerializer(many=True, read_only=True)
    labels = serializers.SerializerMethodField()
    members = UserSerializer(many=True, read_only=True)
    attachments = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    participants = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = Card
        fields = (
            'id', 'title', 'description', 'order', 'due_date', 
            'is_completed', 'is_archived', 'list', 'members', 'participants',
            'labels', 'checklists', 'attachments', 'comments',
            'created_at', 'updated_at'
        )

    def get_labels(self, obj):
        label_ids = obj.card_labels.values_list('label_id', flat=True)
        labels = Label.objects.filter(id__in=label_ids)
        return LabelSerializer(labels, many=True).data

    def get_attachments(self, obj):
        return AttachmentSerializer(obj.attachments.all(), many=True).data

    def get_comments(self, obj):
        return CommentSerializer(obj.comments.all(), many=True).data

class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)
    class Meta:
        model = List
        fields = ('id', 'title', 'order', 'is_archived', 'board', 'cards')

class BoardSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = BoardMemberSerializer(source='memberships', many=True, read_only=True)
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


class FavoriteBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteBoard
        fields = ('id', 'user', 'board')
        read_only_fields = ('user',)


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ('id', 'card', 'file', 'created_at')
        read_only_fields = ('created_at',)


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ('id', 'card', 'user', 'content', 'created_at')
        read_only_fields = ('user', 'created_at')
