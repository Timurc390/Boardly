from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from core.models import Profile, ActivityLog
from core.api.serializers import UserSerializer, ActivityLogSerializer
from core.services.activity_retention import apply_activity_retention
from core.services.activity_logger import log_activity

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = "postmessage"

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get('search') or self.request.query_params.get('q')
        if query:
            queryset = queryset.filter(
                Q(username__icontains=query)
                | Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            )
        return queryset

    @action(detail=False, methods=['get', 'patch', 'delete'], url_path='me')
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            apply_activity_retention(user)
            log_activity(request.user, 'update_profile', 'profile', request.user.id)
            return Response(serializer.data)
        
        elif request.method == 'DELETE':
            request.user.delete()
            return Response(status=204)

    @action(detail=False, methods=['post', 'delete'], url_path='me/avatar')
    def avatar(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if request.method == 'POST':
            avatar = request.FILES.get('avatar')
            if not avatar:
                return Response({'detail': 'avatar_required'}, status=400)
            profile.avatar = avatar
            profile.save()
            log_activity(request.user, 'update_avatar', 'profile', request.user.id)
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)

        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = None
        profile.save()
        log_activity(request.user, 'remove_avatar', 'profile', request.user.id)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='me/password')
    def password(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        current_password = (request.data.get('current_password') or '').strip()
        new_password = request.data.get('new_password') or ''
        re_new_password = request.data.get('re_new_password')

        if not new_password:
            return Response({'new_password': ['This field is required.']}, status=400)
        if not user.email:
            return Response({'email': ['Email is required for password confirmation flow.']}, status=400)

        if re_new_password is not None and new_password != re_new_password:
            return Response({'re_new_password': ['Passwords do not match.']}, status=400)

        if profile.password_initialized:
            if not current_password:
                return Response({'current_password': ['This field is required.']}, status=400)
            if not user.check_password(current_password):
                return Response({'current_password': ['Current password is incorrect.']}, status=400)

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        if not profile.password_initialized:
            profile.password_initialized = True
            profile.save(update_fields=['password_initialized'])
        return Response({'detail': 'password_updated'}, status=200)

    @action(detail=False, methods=['post'], url_path='me/password/check-current')
    def check_current_password(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if not profile.password_initialized:
            return Response({'detail': 'skip_current_password'}, status=200)
        current_password = (request.data.get('current_password') or '').strip()
        if not current_password:
            return Response({'current_password': ['This field is required.']}, status=400)
        if not request.user.check_password(current_password):
            return Response({'current_password': ['Current password is incorrect.']}, status=400)
        return Response({'detail': 'ok'}, status=200)

    @action(detail=False, methods=['post'], url_path='me/password/request-change')
    def request_password_change(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        current_password = (request.data.get('current_password') or '').strip()
        new_password = request.data.get('new_password') or ''
        re_new_password = request.data.get('re_new_password')

        if not new_password:
            return Response({'new_password': ['This field is required.']}, status=400)

        if re_new_password is not None and new_password != re_new_password:
            return Response({'re_new_password': ['Passwords do not match.']}, status=400)

        if profile.password_initialized:
            if not current_password:
                return Response({'current_password': ['This field is required.']}, status=400)
            if not user.check_password(current_password):
                return Response({'current_password': ['Current password is incorrect.']}, status=400)

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=400)

        profile.pending_password_hash = make_password(new_password)
        profile.pending_password_requested_at = timezone.now()
        profile.save(update_fields=['pending_password_hash', 'pending_password_requested_at'])

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = f"{getattr(settings, 'SITE_PROTOCOL', 'https')}://{getattr(settings, 'SITE_DOMAIN', 'boardly-frontend.fly.dev')}"
        confirm_url = f"{frontend_url}/password-change-confirm/{uid}/{token}"

        subject = 'Boardly: confirm your password change'
        message = (
            "You received this email because a password change was requested for your Boardly account.\n\n"
            "To confirm the password change, open this link:\n"
            f"{confirm_url}\n\n"
            "If you did not request this change, you can safely ignore this email."
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return Response({'detail': 'password_change_confirmation_sent'}, status=200)

    @action(
        detail=False,
        methods=['post'],
        url_path='password/confirm-change',
        permission_classes=[permissions.AllowAny],
    )
    def confirm_password_change(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        if not uid or not token:
            return Response({'detail': 'uid_and_token_required'}, status=400)

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail': 'invalid_link'}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'invalid_link'}, status=400)

        profile, _ = Profile.objects.get_or_create(user=user)
        if not profile.pending_password_hash:
            return Response({'detail': 'no_pending_password_change'}, status=400)

        requested_at = profile.pending_password_requested_at
        if requested_at and requested_at < timezone.now() - timedelta(days=3):
            profile.pending_password_hash = ''
            profile.pending_password_requested_at = None
            profile.save(update_fields=['pending_password_hash', 'pending_password_requested_at'])
            return Response({'detail': 'link_expired'}, status=400)

        user.password = profile.pending_password_hash
        user.save(update_fields=['password'])

        profile.password_initialized = True
        profile.pending_password_hash = ''
        profile.pending_password_requested_at = None
        profile.save(update_fields=['password_initialized', 'pending_password_hash', 'pending_password_requested_at'])
        return Response({'detail': 'password_updated'}, status=200)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        apply_activity_retention(self.request.user)
        return ActivityLog.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='clear')
    def clear(self, request):
        deleted_count, _ = ActivityLog.objects.filter(user=request.user).delete()
        return Response({'deleted': deleted_count}, status=200)
