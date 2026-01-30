from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from core.models import Profile, ActivityLog
from core.api.serializers import UserSerializer, ActivityLogSerializer
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

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            log_activity(request.user, 'update_profile', 'profile', request.user.id)
            return Response(serializer.data)

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

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user).order_by('-created_at')