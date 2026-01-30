"""
Моделі для Списків (List) та Карток (Card).
"""
from django.db import models
from django.contrib.auth.models import User

class List(models.Model):
    """
    Колонка на дошці.
    """
    board = models.ForeignKey('core.Board', on_delete=models.CASCADE, related_name='lists', verbose_name="Дошка")
    title = models.CharField(max_length=255, verbose_name="Назва Списку")
    order = models.DecimalField(max_digits=10, decimal_places=5, default=0, verbose_name="Позиція")
    is_archived = models.BooleanField(default=False, verbose_name="Архівувати Список")

    class Meta:
        verbose_name = "Список"
        verbose_name_plural = "Списки"
        ordering = ['order']
        app_label = 'core'

    def __str__(self):
        return f"{self.title} ({self.board_id})"

class Card(models.Model):
    """
    Завдання (Картка).
    """
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='cards', verbose_name="Список")
    title = models.CharField(max_length=255, verbose_name="Заголовок Картки")
    description = models.TextField(blank=True, verbose_name="Опис Картки")
    card_color = models.CharField(max_length=7, blank=True, default='', verbose_name="Колір Картки (HEX)")
    order = models.DecimalField(max_digits=10, decimal_places=5, default=0, verbose_name="Позиція")
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="Кінцевий термін")
    is_completed = models.BooleanField(default=False, verbose_name="Завершено")
    is_archived = models.BooleanField(default=False, verbose_name="Архівувати Картку")

    # НОВЕ ПОЛЕ: Статус приватності картки
    is_public = models.BooleanField(default=True, verbose_name="Публічна картка")

    members = models.ManyToManyField(User, through='CardMember', related_name='assigned_cards', verbose_name="Призначені учасники")
    
    class Meta:
        verbose_name = "Картка"
        verbose_name_plural = "Картки"
        ordering = ['order']
        app_label = 'core'

    def __str__(self):
        return self.title

class CardMember(models.Model):
    """
    Призначення користувача на картку.
    """
    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="Картка")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")

    class Meta:
        verbose_name = "Призначення Картки"
        verbose_name_plural = "Призначення Карток"
        unique_together = ('card', 'user')
        app_label = 'core'

    def __str__(self):
        return f"{self.user.username} -> {self.card.title}"

class CardLabel(models.Model):
    """
    Зв'язок Картка <-> Мітка.
    """
    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="Картка")
    label = models.ForeignKey('core.Label', on_delete=models.CASCADE, verbose_name="Мітка")

    class Meta:
        verbose_name = "Присвоєння мітки"
        verbose_name_plural = "Присвоєння міток"
        unique_together = ('card', 'label')
        app_label = 'core'

    def __str__(self):
        return f"{self.card.title} -> {self.label_id}"