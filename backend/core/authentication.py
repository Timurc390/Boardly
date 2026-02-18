from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Дозволяє користувачам входити, використовуючи або username, або email.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Якщо 'username' не передано, пробуємо взяти з kwargs (DRF іноді так робить)
        if username is None:
            username = kwargs.get('username') or kwargs.get('email')
            
        if username is None:
            return None

        try:
            # Шукаємо користувача, у якого username АБО email співпадає з введеним текстом
            # iexact робить пошук нечутливим до регістру (admin = Admin)
            user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # Якщо раптом є кілька юзерів з таким email (старі дані), беремо першого
            user = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username)).order_by('id').first()

        # Перевіряємо пароль і чи активний юзер
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
            
        return None