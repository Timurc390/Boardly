"""
Моделі, пов'язані з користувачами та їх профілями.
"""
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# ----------------------------------------------------------------------
# ПРОФІЛЬ КОРИСТУВАЧА
# ----------------------------------------------------------------------

class Profile(models.Model):
    """
    Розширення стандартної моделі User.
    Зберігає налаштування інтерфейсу, аватар та організацію.
    """
    THEME_CHOICES = (
        ('light', 'Світла'),
        ('dark', 'Темна'),
    )
    LANGUAGE_CHOICES = (
        ('uk', 'Ukrainian'),
        ('en', 'English'),
        ('pl', 'Polish'),
        ('de', 'German'),
        ('fr', 'French'),
        ('es', 'Spanish'),
    )
    ACTIVITY_RETENTION_CHOICES = (
        ('7d', '7 days'),
        ('30d', '1 month'),
        ('365d', '1 year'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="Користувач")
    organization = models.CharField(max_length=255, blank=True, verbose_name="Організація")
    theme = models.CharField(max_length=50, choices=THEME_CHOICES, default='dark', verbose_name="Тема інтерфейсу")
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='uk', verbose_name="Language")
    notify_email = models.BooleanField(default=True, verbose_name="Email notifications")
    notify_desktop = models.BooleanField(default=True, verbose_name="Desktop notifications")
    notify_assigned = models.BooleanField(default=True, verbose_name="Assigned task notifications")
    notify_due = models.BooleanField(default=True, verbose_name="Due date notifications")
    notify_added = models.BooleanField(default=True, verbose_name="Added to board notifications")
    activity_retention = models.CharField(
        max_length=10,
        choices=ACTIVITY_RETENTION_CHOICES,
        default='30d',
        verbose_name="Activity retention period"
    )
    default_board_view = models.CharField(
        max_length=20,
        choices=(('kanban', 'Kanban'), ('calendar', 'Calendar')),
        default='kanban',
        verbose_name="Default board view"
    )
    session_timeout = models.CharField(max_length=20, default='1h', verbose_name="Session timeout")
    two_factor_enabled = models.BooleanField(default=False, verbose_name="Two-factor enabled")
    require_login_verification = models.BooleanField(default=False, verbose_name="Require login verification")
    password_initialized = models.BooleanField(
        default=True,
        verbose_name="Require current password on password change"
    )
    pending_password_hash = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name="Pending password hash"
    )
    pending_password_requested_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Pending password requested at"
    )
    bio = models.TextField(blank=True, verbose_name="Bio")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Avatar")
    
    class Meta:
        verbose_name = "Профіль"
        verbose_name_plural = "Профілі"
        app_label = 'core'
    
    def __str__(self):
        return f"Профіль {self.user.username}"

# Сигнали для автоматичного створення/оновлення профілю
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)


# ----------------------------------------------------------------------
# ЛОГИ АКТИВНОСТІ (USER LOGS)
# ----------------------------------------------------------------------

class ActivityLog(models.Model):
    """
    Журнал дій користувача (для історії в профілі).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs', verbose_name="Користувач")
    action = models.CharField(max_length=100, verbose_name="Дія")
    entity_type = models.CharField(max_length=50, blank=True, verbose_name="Тип сутності")
    entity_id = models.IntegerField(null=True, blank=True, verbose_name="ID сутності")
    meta = models.JSONField(default=dict, blank=True, verbose_name="Дані")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Час дії")

    class Meta:
        verbose_name = "Лог дій"
        verbose_name_plural = "Логи дій"
        ordering = ['-created_at']
        app_label = 'core'

    def __str__(self):
        return f"{self.user.username}: {self.action}"
