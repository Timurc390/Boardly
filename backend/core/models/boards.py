"""
Моделі для Дошок (Boards), Учасників та Міток.
"""
from django.db import models
from django.contrib.auth.models import User
import uuid

class Board(models.Model):
    """
    Основна сутність - Дошка.
    """
    title = models.CharField(max_length=255, verbose_name="Назва Дошки")
    description = models.TextField(blank=True, verbose_name="Опис Дошки")
    background_url = models.TextField(blank=True, verbose_name="Фон Дошки")
    is_archived = models.BooleanField(default=False, verbose_name="Архівувати Дошку")
    # is_favorite видалено звідси, тепер це персональне налаштування в Membership
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_boards', verbose_name="Власник")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")
    invite_link = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name="Посилання-запрошення")
    
    # Зв'язок M:M через Membership
    members = models.ManyToManyField(User, through='Membership', related_name='boards', verbose_name="Учасники")

    class Meta:
        verbose_name = "Дошка"
        verbose_name_plural = "Дошки"
        ordering = ['title']
        app_label = 'core'

    def __str__(self):
        return self.title

class Membership(models.Model):
    """
    Зв'язок Користувач <-> Дошка з ролями та персональними налаштуваннями.
    """
    ROLE_CHOICES = (
        ('admin', 'Адміністратор'),
        ('member', 'Учасник'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")
    board = models.ForeignKey(Board, on_delete=models.CASCADE, verbose_name="Дошка")
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='member', verbose_name="Роль")
    
    # Персональне налаштування "Обране" для кожного учасника
    is_favorite = models.BooleanField(default=False, verbose_name="В обраному")

    class Meta:
        verbose_name = "Участь у Дошці"
        verbose_name_plural = "Участь у Дошках"
        unique_together = ('user', 'board')
        app_label = 'core'

    def __str__(self):
        return f"{self.user.username} - {self.board.title} ({self.role})"

class Label(models.Model):
    """
    Кольорова мітка для карток на дошці.
    """
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='labels', verbose_name="Дошка")
    name = models.CharField(max_length=50, verbose_name="Назва мітки")
    color = models.CharField(max_length=7, verbose_name="Колір (HEX)")

    class Meta:
        verbose_name = "Мітка"
        verbose_name_plural = "Мітки"
        unique_together = ('board', 'name')
        app_label = 'core'

    def __str__(self):
        return f"{self.name} ({self.board.title})"

class Activity(models.Model):
    """
    Журнал подій на дошці (хто що зробив).
    """
    ACTION_TYPES = (
        ('CREATE_BOARD', 'Створення дошки'),
        ('UPDATE_BOARD', 'Оновлення дошки'),
        ('CREATE_LIST', 'Створення списку'),
        ('MOVE_LIST', 'Переміщення списку'),
        ('CREATE_CARD', 'Створення картки'),
        ('MOVE_CARD', 'Переміщення картки'),
        ('UPDATE_CARD', 'Оновлення картки'),
        ('ARCHIVE_CARD', 'Архівування картки'),
        ('MEMBER_JOIN', 'Приєднання учасника'),
    )

    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='activities', verbose_name="Дошка")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Користувач")
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES, verbose_name="Тип дії")
    action_text = models.TextField(verbose_name="Опис дії")
    target_id = models.IntegerField(null=True, blank=True, verbose_name="ID цілі")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Час дії")

    class Meta:
        verbose_name = "Дія"
        verbose_name_plural = "Журнал дій"
        ordering = ['-timestamp']
        app_label = 'core'

    def __str__(self):
        return f"[{self.action_type}] {self.user.username if self.user else 'Система'}: {self.action_text}"