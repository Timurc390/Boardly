import { useMemo } from 'react';
import { type Board, type Card } from '../../../types';

export const COLORBLIND_COVER_MAP: Record<string, string> = {
  '#216e4e': '#1d70b8',
  '#7f5f01': '#b26a00',
  '#9e4c00': '#8b3fb9',
  '#ae2e24': '#005ea5',
  '#803fa5': '#b25d00',
  '#1558bc': '#006b6b',
  '#206a83': '#5f3dc4',
  '#4c6b1f': '#0b7a75',
  '#943d73': '#7a2b8f',
  '#63666b': '#2b6cb0',
};

export const useCardModalPermissions = (card: Card, board: Board, userId?: number) => {
  return useMemo(() => {
    const membership = board.members?.find((member) => member.user.id === userId);
    const role = membership?.role;
    const isOwner = board.owner?.id === userId;
    const isAdmin = role === 'admin';
    const isDeveloper = role === 'developer';
    const isViewer = role === 'viewer';
    const isCardMember = card.members?.some((member) => member.id === userId);

    const developerCanEdit = board.dev_can_edit_assigned_cards ?? true;
    const developerCanArchive = board.dev_can_archive_assigned_cards ?? true;
    const developerCanJoin = board.dev_can_join_card ?? true;

    const canEditCard = Boolean(isOwner || isAdmin || (isDeveloper && developerCanEdit && isCardMember));
    const canArchiveCard = Boolean(isOwner || isAdmin || (isDeveloper && developerCanArchive && isCardMember));
    const canDeleteCard = Boolean(isOwner || isAdmin);
    const canManageMembers = Boolean(isOwner || isAdmin);
    const canJoinCard = Boolean(canManageMembers || (isDeveloper && developerCanJoin));
    const canLeaveCard = Boolean(isCardMember);
    const canComment = Boolean(isOwner || isAdmin || isDeveloper || isViewer);
    const quickActionsDisabled = !(canEditCard || isOwner || isAdmin || isDeveloper);

    const coverColor = card.card_color?.trim();
    const hasCover = Boolean(coverColor);
    const coverMode = card.cover_size === 'full' ? 'full' : 'header';

    const resolveCoverColor = (color?: string | null, isColorblindMode = false) => {
      const normalized = (color || '').trim().toLowerCase();
      if (!normalized) return color || '';
      if (!isColorblindMode) return color || normalized;
      return COLORBLIND_COVER_MAP[normalized] || color || normalized;
    };

    return {
      isOwner,
      isAdmin,
      isDeveloper,
      isViewer,
      isCardMember,
      canEditCard,
      canArchiveCard,
      canDeleteCard,
      canManageMembers,
      canJoinCard,
      canLeaveCard,
      canComment,
      quickActionsDisabled,
      coverColor,
      hasCover,
      coverMode,
      resolveCoverColor,
    };
  }, [board, card, userId]);
};
