from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

# ----------------------------------------------------------------------
# 1. КОРИСТУВАЧІ ТА ПРОФІЛЬ (Auth & User Data)
# ----------------------------------------------------------------------

class Profile(models.Model):
    """
    Таблиця: Profile
    Розширення стандартної моделі User для зберігання додаткових даних 
    (організація, тема), як вимагає ТЗ.
    Зв'язок: Один до Одного з User.
    """
    THEME_CHOICES = (
        ('light', 'Світла'),
        ('dark', 'Темна'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="Користувач")
    organization = models.CharField(max_length=255, blank=True, verbose_name="Організація")
    theme = models.CharField(max_length=50, choices=THEME_CHOICES, default='light', verbose_name="Тема інтерфейсу")
    
    class Meta:
        verbose_name = "Профіль"
        verbose_name_plural = "Профілі"
    
    def __str__(self):
        return f"Профіль {self.user.username}"

# Сигнали для автоматичного створення/оновлення профілю при створенні/оновленні User
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Створює профіль, коли створюється новий користувач."""
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Зберігає профіль, коли оновлюється користувач."""
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        # Створюємо, якщо профіль відсутній
        Profile.objects.create(user=instance)


# ----------------------------------------------------------------------
# 2. УПРАВЛІННЯ ДОШКАМИ (Boards)
# ----------------------------------------------------------------------

class Board(models.Model):
    """
    Таблиця: Board
    Основна робоча область (Дошка).
    Включає поля для керування фоном, архівацією та посиланням-запрошенням.
    """
    title = models.CharField(max_length=255, verbose_name="Назва Дошки")
    description = models.TextField(blank=True, verbose_name="Опис Дошки")
    # background_url може зберігати URL зображення або HEX-код кольору
    background_url = models.CharField(max_length=255, blank=True, verbose_name="Фон Дошки")
    is_archived = models.BooleanField(default=False, verbose_name="Архівувати Дошку")
    is_favorite = models.BooleanField(default=False, verbose_name="Обрана Дошка")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_boards', verbose_name="Власник")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")
    # invite_link буде генеруватися автоматично, ми використовуємо UUID для унікальності
    invite_link = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name="Посилання-запрошення")
    
    # Зв'язок Багато до Багатьох через проміжну модель Membership
    members = models.ManyToManyField(User, through='Membership', related_name='boards', verbose_name="Учасники")

    class Meta:
        verbose_name = "Дошка"
        verbose_name_plural = "Дошки"
        # Сортуємо за алфавітом, але обрані дошки будуть відображатися окремо на фронтенді
        ordering = ['title'] 

    def __str__(self):
        return self.title

class Membership(models.Model):
    """
    Проміжна таблиця: Membership
    Зв'язок M:M між User та Board. Зберігає роль учасника на Дошці.
    """
    ROLE_CHOICES = (
        ('admin', 'Адміністратор'),
        ('member', 'Учасник'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")
    board = models.ForeignKey(Board, on_delete=models.CASCADE, verbose_name="Дошка")
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='member', verbose_name="Роль")

    class Meta:
        verbose_name = "Участь у Дошці"
        verbose_name_plural = "Участь у Дошках"
        # Складений унікальний ключ: користувач може бути учасником дошки лише один раз
        unique_together = ('user', 'board') 

    def __str__(self):
        return f"{self.user.username} - {self.board.title} ({self.role})"


# ----------------------------------------------------------------------
# 3. СПИСКИ ТА КАРТКИ (Lists & Cards)
# ----------------------------------------------------------------------

class List(models.Model):
    """
    Таблиця: List
    Вертикальна колонка на Дошці (наприклад, To Do, In Progress).
    Поле 'order' використовується для Drag & Drop.
    """
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='lists', verbose_name="Дошка")
    title = models.CharField(max_length=255, verbose_name="Назва Списку")
    # DecimalField для плавного переміщення (Drag & Drop)
    order = models.DecimalField(max_digits=10, decimal_places=5, default=0, verbose_name="Позиція")
    is_archived = models.BooleanField(default=False, verbose_name="Архівувати Список")

    class Meta:
        verbose_name = "Список"
        verbose_name_plural = "Списки"
        # Сортування списків на дошці за їх позицією
        ordering = ['order'] 

    def __str__(self):
        return f"{self.title} ({self.board.title})"

class Card(models.Model):
    """
    Таблиця: Card
    Основний елемент завдання, що міститься у Списку.
    """
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='cards', verbose_name="Список")
    title = models.CharField(max_length=255, verbose_name="Заголовок Картки")
    description = models.TextField(blank=True, verbose_name="Опис Картки")
    # DecimalField для плавного переміщення (Drag & Drop)
    order = models.DecimalField(max_digits=10, decimal_places=5, default=0, verbose_name="Позиція")
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="Кінцевий термін")
    is_completed = models.BooleanField(default=False, verbose_name="Завершено")
    is_archived = models.BooleanField(default=False, verbose_name="Архівувати Картку")

    # Зв'язок M:M через CardMember для призначення учасників
    members = models.ManyToManyField(User, through='CardMember', related_name='assigned_cards', verbose_name="Призначені учасники")
    
    class Meta:
        verbose_name = "Картка"
        verbose_name_plural = "Картки"
        # Сортування карток у списку за їх позицією
        ordering = ['order']

    def __str__(self):
        return self.title

class CardMember(models.Model):
    """
    Проміжна таблиця: CardMember
    Зв'язок M:M між Card та User. Призначення користувачів на Картку.
    """
    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="Картка")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Користувач")

    class Meta:
        verbose_name = "Призначення Картки"
        verbose_name_plural = "Призначення Карток"
        # Гарантує, що користувач не може бути призначений до однієї Картки двічі
        unique_together = ('card', 'user')

    def __str__(self):
        return f"{self.user.username} призначений на {self.card.title}"


# ----------------------------------------------------------------------
# 4. ДЕТАЛІЗАЦІЯ КАРТКИ (Labels, Checklists)
# ----------------------------------------------------------------------

class Label(models.Model):
    """
    Таблиця: Label
    Кольорова мітка, що належить конкретній Дошці (Board).
    """
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='labels', verbose_name="Дошка")
    name = models.CharField(max_length=50, verbose_name="Назва мітки")
    # Зберігаємо HEX-код кольору, наприклад, #FF5733
    color = models.CharField(max_length=7, verbose_name="Колір (HEX)")

    class Meta:
        verbose_name = "Мітка"
        verbose_name_plural = "Мітки"
        # Мітка повинна бути унікальною лише в межах однієї дошки
        unique_together = ('board', 'name') 

    def __str__(self):
        return f"{self.name} ({self.board.title})"

class CardLabel(models.Model):
    """
    Проміжна таблиця: CardLabel
    Зв'язок M:M між Card та Label (Картка може мати багато міток, мітка - на багатьох картках).
    """
    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="Картка")
    label = models.ForeignKey(Label, on_delete=models.CASCADE, verbose_name="Мітка")

    class Meta:
        verbose_name = "Присвоєння мітки"
        verbose_name_plural = "Присвоєння міток"
        unique_together = ('card', 'label')

    def __str__(self):
        return f"{self.card.title} -> {self.label.name}"


class Checklist(models.Model):
    """
    Таблиця: Checklist
    Чек-лист або список підзадач, що належить конкретній Картці.
    """
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='checklists', verbose_name="Картка")
    title = models.CharField(max_length=255, verbose_name="Назва чек-листа")

    class Meta:
        verbose_name = "Чек-лист"
        verbose_name_plural = "Чек-листи"

    def __str__(self):
        return f"{self.title} для {self.card.title}"

class ChecklistItem(models.Model):
    """
    Таблиця: ChecklistItem
    Окремий пункт у чек-листі (підзадача).
    """
    checklist = models.ForeignKey(Checklist, on_delete=models.CASCADE, related_name='items', verbose_name="Чек-лист")
    text = models.CharField(max_length=500, verbose_name="Текст підзадачі")
    is_checked = models.BooleanField(default=False, verbose_name="Виконано")
    order = models.IntegerField(default=0, verbose_name="Позиція")

    class Meta:
        verbose_name = "Пункт чек-листа"
        verbose_name_plural = "Пункти чек-листів"
        ordering = ['order']

    def __str__(self):
        return self.text

# ----------------------------------------------------------------------
# 5. СИСТЕМНІ ЕЛЕМЕНТИ (Activity)
# ----------------------------------------------------------------------

class Activity(models.Model):
    """
    Таблиця: Activity
    Журнал дій для відстеження змін на Дошці (Real-time оновлення).
    """
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='activities', verbose_name="Дошка")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Користувач")
    action_text = models.TextField(verbose_name="Опис дії")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Час дії")
    
    # Додаткові поля для детального відстеження, наприклад:
    # card = models.ForeignKey(Card, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пов'язана Картка")
    
    class Meta:
        verbose_name = "Дія"
        verbose_name_plural = "Журнал дій"
        ordering = ['-timestamp'] # Сортування від найновіших до найстаріших

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user.username if self.user else 'Система'}: {self.action_text}"