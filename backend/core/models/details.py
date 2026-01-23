"""
Деталізація картки: Чек-лісти, Вкладення, Коментарі.
"""
from django.db import models
from django.contrib.auth.models import User

class Checklist(models.Model):
    """
    Група підзадач.
    """
    # Використовуємо 'core.Card'
    card = models.ForeignKey('core.Card', on_delete=models.CASCADE, related_name='checklists', verbose_name="Картка")
    title = models.CharField(max_length=255, verbose_name="Назва чек-листа")

    class Meta:
        verbose_name = "Чек-лист"
        verbose_name_plural = "Чек-листи"
        app_label = 'core'

    def __str__(self):
        return f"{self.title}"

class ChecklistItem(models.Model):
    """
    Пункт чек-листа.
    """
    checklist = models.ForeignKey(Checklist, on_delete=models.CASCADE, related_name='items', verbose_name="Чек-лист")
    text = models.CharField(max_length=500, verbose_name="Текст підзадачі")
    is_checked = models.BooleanField(default=False, verbose_name="Виконано")
    order = models.IntegerField(default=0, verbose_name="Позиція")

    class Meta:
        verbose_name = "Пункт чек-листа"
        verbose_name_plural = "Пункти чек-листів"
        ordering = ['order']
        app_label = 'core'

    def __str__(self):
        return self.text

class Attachment(models.Model):
    """
    Файли картки.
    """
    card = models.ForeignKey('core.Card', on_delete=models.CASCADE, related_name='attachments', verbose_name="Картка")
    file = models.FileField(upload_to='attachments/', verbose_name="Файл")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата завантаження")
    
    class Meta:
        verbose_name = "Вкладення"
        verbose_name_plural = "Вкладення"
        app_label = 'core'

    def __str__(self):
        return f"Вкладення {self.id}"

class Comment(models.Model):
    """
    Коментарі.
    """
    card = models.ForeignKey('core.Card', on_delete=models.CASCADE, related_name='comments', verbose_name="Картка")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name="Автор")
    text = models.TextField(verbose_name="Текст коментаря")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")

    class Meta:
        verbose_name = "Коментар"
        verbose_name_plural = "Коментарі"
        ordering = ['created_at']
        app_label = 'core'

    def __str__(self):
        return f"Comment {self.id} by {self.author.username}"