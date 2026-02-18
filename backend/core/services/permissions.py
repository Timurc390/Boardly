from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

from core.models import Membership, CardMember


def get_board_membership(user, board):
    if not user or user.is_anonymous or not board:
        return None
    return Membership.objects.filter(board=board, user=user).first()


def get_board_role(user, board):
    if not user or user.is_anonymous or not board:
        return None
    if getattr(board, 'owner_id', None) == user.id:
        return 'owner'
    membership = get_board_membership(user, board)
    return membership.role if membership else None


def is_board_owner(user, board) -> bool:
    return bool(user and not user.is_anonymous and board and getattr(board, 'owner_id', None) == user.id)


def is_board_admin(user, board) -> bool:
    if is_board_owner(user, board):
        return True
    return Membership.objects.filter(board=board, user=user, role='admin').exists()


def is_board_developer(user, board) -> bool:
    return Membership.objects.filter(board=board, user=user, role='developer').exists()


def is_board_viewer(user, board) -> bool:
    return Membership.objects.filter(board=board, user=user, role='viewer').exists()


def ensure_board_admin(user, board, message='Only admins can perform this action.'):
    if is_board_admin(user, board):
        return True
    raise PermissionDenied(message)


def ensure_board_member(user, board, message='Only board members can perform this action.'):
    if is_board_owner(user, board) or Membership.objects.filter(board=board, user=user).exists():
        return True
    raise PermissionDenied(message)


def is_card_member(user, card) -> bool:
    if not user or user.is_anonymous or not card:
        return False
    return CardMember.objects.filter(card=card, user=user).exists()


def can_create_list(user, board) -> bool:
    if is_board_admin(user, board):
        return True
    if is_board_developer(user, board) and board.dev_can_create_lists:
        return True
    return False


def can_create_card(user, list_obj) -> bool:
    if not list_obj:
        return False
    board = list_obj.board
    if is_board_admin(user, board):
        return True
    if is_board_developer(user, board) and board.dev_can_create_cards and list_obj.allow_dev_add_cards:
        return True
    return False


def can_edit_card(user, card) -> bool:
    if not card:
        return False
    board = card.list.board
    if is_board_admin(user, board):
        return True
    if is_board_developer(user, board) and board.dev_can_edit_assigned_cards and is_card_member(user, card):
        return True
    return False


def can_archive_card(user, card) -> bool:
    if not card:
        return False
    board = card.list.board
    if is_board_admin(user, board):
        return True
    if is_board_developer(user, board) and board.dev_can_archive_assigned_cards and is_card_member(user, card):
        return True
    return False


def can_move_card_to_list(user, card, target_list) -> bool:
    if not card or not target_list:
        return False
    board = target_list.board
    if is_board_admin(user, board):
        return True
    if is_board_developer(user, board):
        if not (board.dev_can_edit_assigned_cards and board.dev_can_create_cards):
            return False
        if not is_card_member(user, card):
            return False
        return target_list.allow_dev_add_cards
    return False


def can_manage_card_members(user, board) -> bool:
    return is_board_admin(user, board)


def can_join_card(user, card) -> bool:
    board = card.list.board
    if is_board_admin(user, board):
        return True
    if is_board_developer(user, board) and board.dev_can_join_card:
        return True
    return False


def can_comment_create(user, card) -> bool:
    if not card:
        return False
    board = card.list.board
    return is_board_owner(user, board) or Membership.objects.filter(board=board, user=user).exists()


def can_comment_edit(user, comment) -> bool:
    if not comment:
        return False
    board = comment.card.list.board
    if is_board_admin(user, board):
        return True
    return comment.author_id == getattr(user, 'id', None)


def can_comment_delete(user, comment) -> bool:
    if not comment:
        return False
    board = comment.card.list.board
    return is_board_admin(user, board)


def ensure_card_edit(user, card, message='Only card members or admins can update cards.'):
    if can_edit_card(user, card):
        return True
    raise PermissionDenied(message)


def ensure_card_archive(user, card, message='Only admins can archive cards.'):
    if can_archive_card(user, card):
        return True
    raise PermissionDenied(message)


def ensure_card_move(user, card, target_list, message='Only admins can move cards to this list.'):
    if can_move_card_to_list(user, card, target_list):
        return True
    raise PermissionDenied(message)


def ensure_comment_create(user, card, message='Only board members can add comments.'):
    if can_comment_create(user, card):
        return True
    raise PermissionDenied(message)


def ensure_comment_edit(user, comment, message='Only author or admins can edit comments.'):
    if can_comment_edit(user, comment):
        return True
    raise PermissionDenied(message)


def ensure_comment_delete(user, comment, message='Only admins can delete comments.'):
    if can_comment_delete(user, comment):
        return True
    raise PermissionDenied(message)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Дозволяє редагування лише власнику об'єкта.
    Для інших - лише читання.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True

        if request.method in ('PUT', 'PATCH') and hasattr(obj, 'owner_id') and is_board_admin(request.user, obj):
            return True

        if request.method in ('PUT', 'PATCH') and hasattr(obj, 'board'):
            return is_board_admin(request.user, obj.board)

        return False
