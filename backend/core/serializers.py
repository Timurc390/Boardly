from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer # Імпортуємо базовий серіалізатор Djoser
from .models import (
    Profile, Board, Membership, List, Card, CardMember,
    Label, CardLabel, Checklist, ChecklistItem, Activity
)

# ----------------------------------------------------------------------
# 1. СЕРІАЛІЗАТОРИ КОРИСТУВАЧІВ ТА ПРОФІЛЮ
# ----------------------------------------------------------------------

# НОВИЙ СЕРІАЛІЗАТОР ДЛЯ РЕЄСТРАЦІЇ
class UserCreateSerializer(DjoserUserCreateSerializer):
    """
    Спеціалізований серіалізатор для створення користувача (реєстрації).
    Наслідує логіку хешування пароля від Djoser.
    """
    class Meta(DjoserUserCreateSerializer.Meta):
        # Додаємо поля first_name та last_name для реєстрації
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name') 

class ProfileSerializer(serializers.ModelSerializer):
    """Серіалізатор для моделі Profile."""
    class Meta:
        model = Profile
        fields = ('organization', 'theme')

class UserSerializer(serializers.ModelSerializer):
    """
    Базовий серіалізатор для моделі User. 
    Використовується для відображення власників, учасників та виконавців карток.
    """
    profile = ProfileSerializer(read_only=True) # Вкладаємо профіль
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'profile')
        read_only_fields = ('username', 'email') # Забороняємо змінювати логін та email через цей серіалізатор


# ----------------------------------------------------------------------
# 2. СЕРІАЛІЗАТОРИ ДЕТАЛІЗАЦІЇ
# ----------------------------------------------------------------------

# Серіалізатор для проміжної таблиці Membership (для відображення учасників дошки)
class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Відображаємо деталі користувача
    
    class Meta:
        model = Membership
        fields = ('user', 'role')

# Серіалізатор для окремого пункту підзадачі
class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ('id', 'text', 'is_checked', 'order')

# Серіалізатор для чек-листа (включає його пункти)
class ChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True) # Вкладаємо пункти підзадач
    
    class Meta:
        model = Checklist
        fields = ('id', 'title', 'items')

# Серіалізатор для міток
class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ('id', 'name', 'color')

# Серіалізатор для Журналу Дій (Activity)
class ActivitySerializer(serializers.ModelSerializer):
    """Серіалізатор для моделі Activity (Журнал дій)."""
    user = UserSerializer(read_only=True) # Відображаємо, хто виконав дію
    
    class Meta:
        model = Activity
        fields = ('id', 'board', 'user', 'action_text', 'timestamp')
        read_only_fields = ('board', 'user', 'action_text', 'timestamp') # Усе читається лише

# ----------------------------------------------------------------------
# 3. СЕРІАЛІЗАТОРИ КАРТОК, СПИСКІВ ТА ДОШОК (З Вкладеннями)
# ----------------------------------------------------------------------

class CardSerializer(serializers.ModelSerializer):
    """Серіалізатор для моделі Card."""
    # Відображаємо учасників та чек-листи безпосередньо у картці
    checklists = ChecklistSerializer(many=True, read_only=True)
    # Зверніть увагу: ми використовуємо CardLabel для зв'язку з мітками. 
    labels = LabelSerializer(many=True, read_only=True, source='label_set') 
    members = UserSerializer(many=True, read_only=True) # Відображаємо призначених користувачів

    class Meta:
        model = Card
        fields = (
            'id', 'title', 'description', 'order', 'due_date', 
            'is_completed', 'is_archived', 'list', 'members', 'labels', 'checklists'
        )

class ListSerializer(serializers.ModelSerializer):
    """Серіалізатор для моделі List (включає картки)."""
    cards = CardSerializer(many=True, read_only=True) # Вкладаємо всі картки у список
    
    class Meta:
        model = List
        fields = ('id', 'title', 'order', 'is_archived', 'board', 'cards')

class BoardSerializer(serializers.ModelSerializer):
    """
    Основний серіалізатор для моделі Board.
    Вкладає учасників та списки для повного відображення дошки.
    """
    owner = UserSerializer(read_only=True) # Власник дошки
    members = MembershipSerializer(source='membership_set', many=True, read_only=True) # Учасники дошки
    lists = ListSerializer(many=True, read_only=True) # Списки на дошці
    labels = LabelSerializer(many=True, read_only=True) # Мітки дошки

    class Meta:
        model = Board
        fields = (
            'id', 'title', 'description', 'background_url', 
            'is_archived', 'is_favorite', 'owner', 'created_at', 
            'invite_link', 'members', 'lists', 'labels'
        )
        read_only_fields = ('owner', 'invite_link', 'created_at')