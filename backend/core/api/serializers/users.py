from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer as DjoserUserCreateSerializer
from core.models import Profile, ActivityLog

class UserCreateSerializer(DjoserUserCreateSerializer):
    class Meta(DjoserUserCreateSerializer.Meta):
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def validate_email(self, value):
        # Перевіряємо, чи існує вже користувач з таким email (нечутливо до регістру)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Користувач з таким email вже існує.")
        return value

class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ('organization', 'bio', 'theme', 'language', 'notify_email', 'avatar', 'avatar_url')

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'profile')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Користувач з таким email вже існує.")
        return value

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username не може бути порожнім.")
        if User.objects.filter(username__iexact=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Користувач з таким username вже існує.")
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        instance = super().update(instance, validated_data)

        if profile_data:
            profile_instance, _ = Profile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile_instance, attr, value)
            profile_instance.save()

        return instance

class ActivityLogSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='action', read_only=True)
    message = serializers.SerializerMethodField()
    board_id = serializers.SerializerMethodField()
    card_id = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'action', 'type', 'message', 'entity_type', 'entity_id', 'meta', 'board_id', 'card_id', 'created_at', 'user')

    def get_message(self, obj):
        base = obj.action.replace('_', ' ').capitalize()
        title = obj.meta.get('title') if isinstance(obj.meta, dict) else None
        if title:
            return f'{base}: {title}'
        return base

    def get_board_id(self, obj):
        if isinstance(obj.meta, dict) and obj.meta.get('board_id'):
            return obj.meta.get('board_id')
        return None

    def get_card_id(self, obj):
        if isinstance(obj.meta, dict) and obj.meta.get('card_id'):
            return obj.meta.get('card_id')
        if obj.entity_type == 'card':
            return obj.entity_id
        return None
