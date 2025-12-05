from django.contrib import admin
from .models import (
    Profile, Board, Membership, List, Card, CardMember, 
    Label, CardLabel, Checklist, ChecklistItem, Activity
)
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# ----------------------------------------------------------------------
# INLINES (Вбудовані форми)
# Використовуються для відображення дочірніх об'єктів на сторінці батьківського.
# ----------------------------------------------------------------------

# Учасники Дошки (для BoardAdmin)
class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 1 # Кількість порожніх рядків для додавання нових учасників
    fields = ('user', 'role')
    raw_id_fields = ('user',) # Використовуємо поле для ID, щоб уникнути завантаження всіх користувачів

# Учасники Картки (для CardAdmin) - НОВИЙ INLINE
class CardMemberInline(admin.TabularInline):
    model = CardMember
    extra = 1
    fields = ('user',)
    raw_id_fields = ('user',) # Використовуємо поле для ID, щоб уникнути завантаження всіх користувачів

# Списки на Дошці (для BoardAdmin)
class ListInline(admin.TabularInline):
    model = List
    extra = 1
    fields = ('title', 'order', 'is_archived')

# Мітки Дошки (для BoardAdmin)
class LabelInline(admin.TabularInline):
    model = Label
    extra = 1
    fields = ('name', 'color')

# Чек-листи Картки (для CardAdmin)
class ChecklistInline(admin.TabularInline):
    model = Checklist
    extra = 1

# Пункти Чек-листа (для ChecklistAdmin)
class ChecklistItemInline(admin.TabularInline):
    model = ChecklistItem
    extra = 3
    fields = ('text', 'is_checked', 'order')

# ----------------------------------------------------------------------
# MODEL ADMINS (Конфігурація моделей)
# ----------------------------------------------------------------------

# 1. КОРИСТУВАЧІ ТА ПРОФІЛЬ

# Вбудовуємо Profile у стандартну адмінку User
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Профіль'
    fk_name = 'user'

class CustomUserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = BaseUserAdmin.list_display + ('organization_display',)
    
    def organization_display(self, obj):
        return obj.profile.organization
    organization_display.short_description = 'Організація'

# Знімаємо реєстрацію стандартного User, щоб зареєструвати свій CustomUserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# 2. УПРАВЛІННЯ ДОШКАМИ

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'is_archived', 'is_favorite', 'created_at')
    list_filter = ('is_archived', 'is_favorite', 'owner')
    search_fields = ('title', 'description')
    readonly_fields = ('invite_link', 'created_at') # Посилання-запрошення генерується автоматично

    inlines = [MembershipInline, ListInline, LabelInline] # Вбудовуємо дочірні об'єкти


# 3. СПИСКИ ТА КАРТКИ

@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ('title', 'board', 'order', 'is_archived')
    list_filter = ('board', 'is_archived')
    search_fields = ('title',)
    # Дозволяє редагувати order без переходу на окрему сторінку
    list_editable = ('order',) 


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('title', 'list', 'due_date', 'is_completed', 'is_archived')
    list_filter = ('list__board', 'is_completed', 'is_archived', 'members')
    search_fields = ('title', 'description')
    
    # ДОДАНО INLINE для управління учасниками (CardMember)
    inlines = [CardMemberInline, ChecklistInline] 


# 4. ДЕТАЛІЗАЦІЯ КАРТКИ

# Конфігурація Checklist, щоб дозволити редагування пунктів
@admin.register(Checklist)
class ChecklistAdmin(admin.ModelAdmin):
    list_display = ('title', 'card')
    inlines = [ChecklistItemInline]
    
# Прості моделі реєструємо стандартно
admin.site.register(CardLabel) 
admin.site.register(ChecklistItem)
# Membership та Label вже вбудовані у BoardAdmin, їх можна прибрати з прямої реєстрації
# admin.site.register(Membership) 
# admin.site.register(Label) 


# 5. СИСТЕМНІ ЕЛЕМЕНТИ

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'board', 'action_text')
    list_filter = ('board', 'user', 'timestamp')
    search_fields = ('action_text',)
    # Забороняємо додавання через адмінку; Activity має створюватися через код (Log)
    def has_add_permission(self, request):
        return False
    # Забороняємо редагування
    def has_change_permission(self, request, obj=None):
        return False