from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from .models import (
    Profile, Board, Membership, List, Card, CardMember,
    Label, CardLabel, Checklist, ChecklistItem, Activity
)

from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from .models import (
    Profile, Board, Membership, List, Card, 
    Label, Checklist, ChecklistItem, Activity
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
# 2. СЕРІАЛІЗАТОРИ ДЕТАЛІЗАЦІЇ (Membership, Checklist, Label, Activity)
# ----------------------------------------------------------------------

class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Membership
        fields = ('user', 'role')

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ('id', 'text', 'is_checked', 'order')

class ChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)
    class Meta:
        model = Checklist
        fields = ('id', 'title', 'items')

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
    labels = LabelSerializer(many=True, read_only=True, source='label_set') 
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Card
        fields = (
            'id', 'title', 'description', 'order', 'due_date', 
            'is_completed', 'is_archived', 'list', 'members', 'labels', 'checklists'
        )

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