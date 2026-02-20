from django.conf import settings
from django.core.mail import send_mail
from djoser import email as djoser_email


class BoardlyPasswordResetEmail(djoser_email.PasswordResetEmail):
    """Force reset email links to frontend domain, independent from django.contrib.sites."""

    def get_context_data(self):
        context = super().get_context_data()
        context['domain'] = getattr(settings, 'SITE_DOMAIN', 'boardly-frontend.fly.dev')
        context['site_name'] = getattr(settings, 'SITE_DISPLAY_NAME', 'Boardly')
        context['protocol'] = getattr(settings, 'SITE_PROTOCOL', 'https')
        return context

    def send(self, to, *args, **kwargs):
        """Send password-reset email in English regardless of active UI language."""
        context = self.get_context_data()
        reset_path = (
            getattr(settings, 'DJOSER', {})
            .get('PASSWORD_RESET_CONFIRM_URL', 'password-change-confirm/{uid}/{token}')
            .format(uid=context['uid'], token=context['token'])
            .lstrip('/')
        )
        reset_link = f"{context['protocol']}://{context['domain']}/{reset_path}"
        subject = 'Boardly: password reset request'
        message = (
            f"You received this email because a password reset was requested for your {context['site_name']} account.\n\n"
            "Please open this link to continue:\n"
            f"{reset_link}\n\n"
            "If you did not request a password reset, please ignore this email."
        )
        recipients = [to] if isinstance(to, str) else list(to)
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )


class BoardlyActivationEmail(djoser_email.ActivationEmail):
    """Send account activation email in English with the correct frontend domain."""

    def get_context_data(self):
        context = super().get_context_data()
        context['domain'] = getattr(settings, 'SITE_DOMAIN', 'boardly-frontend.fly.dev')
        context['site_name'] = getattr(settings, 'SITE_DISPLAY_NAME', 'Boardly')
        context['protocol'] = getattr(settings, 'SITE_PROTOCOL', 'https')
        return context

    def send(self, to, *args, **kwargs):
        context = self.get_context_data()
        activation_path = (
            getattr(settings, 'DJOSER', {})
            .get('ACTIVATION_URL', 'activate/{uid}/{token}')
            .format(uid=context['uid'], token=context['token'])
            .lstrip('/')
        )
        activation_link = f"{context['protocol']}://{context['domain']}/{activation_path}"
        subject = 'Boardly: activate your account'
        message = (
            f"You're receiving this email because you need to finish the activation process on {context['site_name']}.\n\n"
            "Please go to the following page to activate your account:\n"
            f"{activation_link}\n\n"
            "Thank you for using Boardly.\n"
            "The Boardly Team"
        )
        recipients = [to] if isinstance(to, str) else list(to)
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
