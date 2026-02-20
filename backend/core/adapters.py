from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string # Імпортуємо генератор рядків
from core.models import Profile

class GoogleAccountAdapter(DefaultSocialAccountAdapter):
    """
    Адаптер для автоматичного об'єднання акаунтів та налаштування пароля.
    """
    def pre_social_login(self, request, sociallogin):
        # 1. Логіка об'єднання акаунтів за email (якщо вже існує)
        if sociallogin.is_existing:
            return

        if request.user.is_authenticated:
            return

        email = sociallogin.account.extra_data.get('email')
        
        if email:
            User = get_user_model()
            try:
                user = User.objects.get(email__iexact=email)
                sociallogin.connect(request, user)
            except User.DoesNotExist:
                pass

    def save_user(self, request, sociallogin, form=None):
        """
        Цей метод викликається при створенні нового користувача через соцмережу.
        """
        user = super().save_user(request, sociallogin, form)
        
        # ВИПРАВЛЕННЯ: Встановлюємо випадковий пароль.
        # Використовуємо get_random_string, оскільки make_random_password застарів/видалений.
        if not user.has_usable_password():
            user.set_password(get_random_string(32)) # Генеруємо 32-символьний пароль
            user.save()

        # Social users get a random password, so allow first password setup without current password.
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.password_initialized = False
        profile.save(update_fields=['password_initialized'])
            
        return user
