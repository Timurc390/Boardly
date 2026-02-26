from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Board, Membership, Label, Activity
from .users import UserSerializer
import logging

logger = logging.getLogger(__name__)

class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)
    board_id = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all(), source='board', write_only=True)
    board = serializers.IntegerField(source='board_id', read_only=True)
    class Meta:
        model = Membership
        fields = ('id', 'user', 'user_id', 'board', 'board_id', 'role', 'is_favorite')

class LabelSerializer(serializers.ModelSerializer):
    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all(), write_only=True)

    class Meta:
        model = Label
        fields = ('id', 'board', 'name', 'color')

class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Activity
        fields = ('id', 'board', 'user', 'action_text', 'timestamp')
        read_only_fields = ('board', 'user', 'action_text', 'timestamp')

class BoardBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ('id', 'title', 'is_archived')

class BoardSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = MembershipSerializer(source='membership_set', many=True, read_only=True)
    lists = serializers.SerializerMethodField()
    labels = LabelSerializer(many=True, read_only=True)
    # Динамічне поле: чи є дошка в обраному у поточного користувача
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Board
        fields = (
            'id', 'title', 'description', 'background_url', 
            'is_archived', 'is_favorite', 'owner', 'created_at', 
            'invite_link', 'members', 'lists', 'labels',
            'dev_can_create_cards', 'dev_can_edit_assigned_cards',
            'dev_can_archive_assigned_cards', 'dev_can_join_card',
            'dev_can_create_lists'
        )
        read_only_fields = ('owner', 'invite_link', 'created_at')

    def get_lists(self, obj):
        from .cards import ListSerializer
        queryset = obj.lists.all()
        logger.warning(
            '[list-move][board-serialize] board_id=%s list_orders=%s',
            obj.id,
            list(queryset.values_list('id', 'title', 'order', 'is_archived')),
        )
        return ListSerializer(queryset, many=True).data

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Перевіряємо Membership поточного користувача
            return Membership.objects.filter(board=obj, user=request.user, is_favorite=True).exists()
        return False
