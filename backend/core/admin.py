from django.contrib import admin
from .models import (
    Profile, Board, Membership, List, Card, CardMember, 
    Label, CardLabel, Checklist, ChecklistItem, Activity, Attachment, Comment
)
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# ----------------------------------------------------------------------
# INLINES (Вбудовані форми)
# ----------------------------------------------------------------------

# Учасники Дошки (для BoardAdmin)
class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 1
    # Додаємо 'is_favorite', тепер це поле тут
    fields = ('user', 'role', 'is_favorite')
    raw_id_fields = ('user',) 

# Учасники Картки (для CardAdmin)
class CardMemberInline(admin.TabularInline):
    model = CardMember
    extra = 1
    fields = ('user',)
    raw_id_fields = ('user',)

# Списки на Дошці (для BoardAdmin)
class ListInline(admin.TabularInline):
    model = List
    extra = 1
    fields = ('title', 'order', 'color', 'is_archived')

# Мітки Дошки (для BoardAdmin)
class LabelInline(admin.TabularInline):
    model = Label
    extra = 1
    fields = ('name', 'color')

class ChecklistItemInline(admin.TabularInline):
    model = ChecklistItem
    extra = 1
    fields = ('text', 'is_checked', 'order')

class ChecklistInline(admin.TabularInline):
    model = Checklist
    extra = 0
    fields = ('title',)
    show_change_link = True

# ----------------------------------------------------------------------
# MODEL ADMINS
# ----------------------------------------------------------------------

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'language', 'theme')
    search_fields = ('user__username', 'organization')

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

# Розширюємо стандартний UserAdmin
admin.site.unregister(User)
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    # ВИПРАВЛЕНО: Видалено 'is_favorite', бо його більше немає в моделі Board
    list_display = ('title', 'owner', 'created_at', 'is_archived')
    list_filter = ('is_archived', 'created_at') # Також видалено з фільтрів
    search_fields = ('title', 'description')
    
    inlines = [MembershipInline, ListInline, LabelInline]
    raw_id_fields = ('owner',)

@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ('title', 'board', 'order', 'color', 'is_archived')
    list_filter = ('board', 'is_archived')
    search_fields = ('title',)
    list_editable = ('order',) 

@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('title', 'list', 'due_date', 'is_completed', 'is_archived')
    list_filter = ('list__board', 'is_completed', 'is_archived', 'members')
    search_fields = ('title', 'description')
    
    inlines = [CardMemberInline, ChecklistInline] 

# 4. ДЕТАЛІЗАЦІЯ КАРТКИ

@admin.register(Checklist)
class ChecklistAdmin(admin.ModelAdmin):
    list_display = ('title', 'card')
    inlines = [ChecklistItemInline]
    
admin.site.register(CardLabel) 
admin.site.register(ChecklistItem)
admin.site.register(Attachment)
admin.site.register(Comment)

# 5. СИСТЕМНІ ЕЛЕМЕНТИ

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'board', 'action_text')
    list_filter = ('board', 'user', 'timestamp')
    search_fields = ('action_text',)
