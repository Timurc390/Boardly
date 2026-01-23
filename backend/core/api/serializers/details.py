from rest_framework import serializers
from core.models import Checklist, ChecklistItem, Attachment, Comment, Card
from .users import UserSerializer

class ChecklistItemSerializer(serializers.ModelSerializer):
    checklist = serializers.PrimaryKeyRelatedField(queryset=Checklist.objects.all(), write_only=True)

    class Meta:
        model = ChecklistItem
        fields = ('id', 'checklist', 'text', 'is_checked', 'order')

class ChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)
    card = serializers.PrimaryKeyRelatedField(queryset=Card.objects.all(), write_only=True)
    class Meta:
        model = Checklist
        fields = ('id', 'card', 'title', 'items')

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ('id', 'card', 'file', 'uploaded_at')
        read_only_fields = ('uploaded_at',)

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ('id', 'card', 'author', 'text', 'created_at')
        read_only_fields = ('author', 'created_at')