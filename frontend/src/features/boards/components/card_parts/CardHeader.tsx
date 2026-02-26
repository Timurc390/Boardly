import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiArchive,
  FiCheckCircle,
  FiChevronDown,
  FiCircle,
  FiCopy,
  FiImage,
  FiLink2,
  FiMoreHorizontal,
  FiMove,
  FiTrash2,
  FiUserPlus,
  FiX,
} from 'shared/ui/fiIcons';
import { Card, Board } from '../../../../types';
import { useI18n } from '../../../../context/I18nContext';
import { confirmAction } from '../../../../shared/utils/confirm';
import { resolveMediaUrl } from '../../../../utils/mediaUrl';

interface CardHeaderProps {
  card: Card;
  board: Board;
  canEdit: boolean;
  onUpdateCard: (data: Partial<Card>) => void;
  onCopyLink: () => void;
  onClose: () => void;
  onCopyCard: () => void;
  onArchiveToggle: () => void;
  onDeleteCard: () => void;
  onMoveCard?: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  isCardMember?: boolean;
  onJoinCard?: () => void;
  onLeaveCard?: () => void;
  onOpenCover?: () => void;
  onOpenHeaderMenu?: () => void;
  closeSignal?: number;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  card, board, canEdit, onUpdateCard, onCopyLink, onClose, onCopyCard, onArchiveToggle, onDeleteCard, onMoveCard,
  isCardMember = false, onJoinCard, onLeaveCard, onOpenCover, onOpenHeaderMenu, closeSignal = 0
}) => {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [movePopoverSource, setMovePopoverSource] = useState<'list' | 'menu' | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const listPillRef = useRef<HTMLButtonElement | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement | null>(null);
  const movePopoverRef = useRef<HTMLDivElement | null>(null);
  const detectTouchViewport = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    const isNarrow = window.matchMedia('(max-width: 980px)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    return isNarrow || isCoarse;
  };
  const [isTouchViewport, setIsTouchViewport] = useState(detectTouchViewport);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [moveCoords, setMoveCoords] = useState<{ top: number; left: number } | null>(null);
  const activeLists = useMemo(() => board.lists?.filter(l => !l.is_archived) || [], [board.lists]);
  const currentList = activeLists.find(l => l.id === card.list);
  const currentIndex = currentList?.cards?.findIndex(c => c.id === card.id) ?? 0;
  const canMoveCard = !!onMoveCard && activeLists.length > 0;
  const [moveListId, setMoveListId] = useState(card.list);
  const [movePosition, setMovePosition] = useState(currentIndex + 1);

  useEffect(() => {
    setMoveListId(card.list);
    setMovePosition(currentIndex + 1);
  }, [card.id, card.list, currentIndex]);
  const listTitle = board.lists?.find(l => l.id === card.list)?.title || t('common.unknown');
  const fallbackAvatar = '/logo.png';
  const getAvatarSrc = (member: NonNullable<Card['members']>[number]) => {
    return resolveMediaUrl(member?.profile?.avatar_url || member?.profile?.avatar, fallbackAvatar);
  };
  const selectedList = activeLists.find(l => l.id === moveListId) || currentList || activeLists[0];
  const maxPosition = Math.max(1, (selectedList?.cards?.filter(c => !c.is_archived).length || 1));
  const positions = Array.from({ length: maxPosition }, (_, idx) => idx + 1);

  const getPopoverCoords = useCallback((anchor: HTMLElement | null, width: number, preferLeftSide: boolean) => {
    if (typeof window === 'undefined' || !anchor) return null;
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const top = Math.min(window.innerHeight - 80, Math.max(margin, rect.bottom + 6));
    const preferredLeft = preferLeftSide ? rect.left - width - 10 : rect.right - width;
    const left = Math.min(window.innerWidth - width - margin, Math.max(margin, preferredLeft));
    return { top, left };
  }, []);

  const syncMenuCoords = useCallback(() => {
    if (isTouchViewport) return;
    setMenuCoords(getPopoverCoords(menuTriggerRef.current, 220, false));
  }, [getPopoverCoords, isTouchViewport]);

  const syncMoveCoords = useCallback(() => {
    if (isTouchViewport) return;
    const anchor = movePopoverSource === 'list' ? listPillRef.current : menuTriggerRef.current;
    const preferLeftSide = movePopoverSource === 'menu';
    setMoveCoords(getPopoverCoords(anchor, 240, preferLeftSide));
  }, [getPopoverCoords, isTouchViewport, movePopoverSource]);

  const closeHeaderMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsMoveOpen(false);
    setMovePopoverSource(null);
    setMenuCoords(null);
    setMoveCoords(null);
  }, []);

  const openMovePopover = useCallback((source: 'list' | 'menu') => {
    if (!canMoveCard) return;
    onOpenHeaderMenu?.();
    setMovePopoverSource(source);
    setIsMenuOpen(false);
    if (!isTouchViewport) {
      const anchor = source === 'list' ? listPillRef.current : menuTriggerRef.current;
      const preferLeftSide = source === 'menu';
      setMoveCoords(getPopoverCoords(anchor, 240, preferLeftSide));
    }
    setIsMoveOpen(true);
  }, [canMoveCard, getPopoverCoords, isTouchViewport, onOpenHeaderMenu]);

  useEffect(() => {
    setMovePosition(prev => Math.min(prev, maxPosition));
  }, [maxPosition]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaNarrow = window.matchMedia('(max-width: 980px)');
    const mediaCoarse = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouchViewport(detectTouchViewport());
    update();
    if (mediaNarrow.addEventListener && mediaCoarse.addEventListener) {
      mediaNarrow.addEventListener('change', update);
      mediaCoarse.addEventListener('change', update);
      return () => {
        mediaNarrow.removeEventListener('change', update);
        mediaCoarse.removeEventListener('change', update);
      };
    }
    mediaNarrow.addListener(update);
    mediaCoarse.addListener(update);
    return () => {
      mediaNarrow.removeListener(update);
      mediaCoarse.removeListener(update);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen || isTouchViewport) return;
    syncMenuCoords();
  }, [isMenuOpen, isTouchViewport, syncMenuCoords]);

  useEffect(() => {
    if (!isMoveOpen || isTouchViewport) return;
    syncMoveCoords();
  }, [isMoveOpen, isTouchViewport, syncMoveCoords]);

  useEffect(() => {
    if ((!isMenuOpen && !isMoveOpen) || isTouchViewport || typeof window === 'undefined') return;
    const sync = () => {
      if (isMenuOpen) syncMenuCoords();
      if (isMoveOpen) syncMoveCoords();
    };
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [isMenuOpen, isMoveOpen, isTouchViewport, syncMenuCoords, syncMoveCoords]);

  useEffect(() => {
    if ((!isMenuOpen && !isMoveOpen) || typeof document === 'undefined') return;

    const handleOutsidePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuTriggerRef.current?.contains(target)) return;
      if (listPillRef.current?.contains(target)) return;
      if (menuDropdownRef.current?.contains(target)) return;
      if (movePopoverRef.current?.contains(target)) return;
      closeHeaderMenus();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeHeaderMenus();
    };

    document.addEventListener('mousedown', handleOutsidePointer, true);
    document.addEventListener('touchstart', handleOutsidePointer, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer, true);
      document.removeEventListener('touchstart', handleOutsidePointer, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeHeaderMenus, isMenuOpen, isMoveOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsMoveOpen(false);
    setMovePopoverSource(null);
    setMenuCoords(null);
    setMoveCoords(null);
  }, [card.id]);

  useEffect(() => {
    if (!closeSignal) return;
    closeHeaderMenus();
  }, [closeHeaderMenus, closeSignal]);

  const handleMove = () => {
    if (!canMoveCard || !onMoveCard || !selectedList) return;
    const destIndex = Math.max(0, Math.min(maxPosition - 1, movePosition - 1));
    onMoveCard(card.id, card.list, selectedList.id, destIndex);
    closeHeaderMenus();
  };

  const fallbackMenuLeft = typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 236) : 8;
  const fallbackMoveLeft = typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 256) : 8;
  const resolvedMenuCoords = menuCoords ?? { top: 72, left: fallbackMenuLeft };
  const resolvedMoveCoords = moveCoords ?? { top: 72, left: fallbackMoveLeft };

  const movePopoverStyle: React.CSSProperties | undefined = !isTouchViewport
    ? {
        position: 'fixed',
        top: resolvedMoveCoords.top,
        left: resolvedMoveCoords.left,
        right: 'auto',
        width: 240,
        zIndex: 'var(--z-card-popover)'
      }
    : undefined;

  const menuDropdownStyle: React.CSSProperties | undefined = !isTouchViewport
    ? {
        position: 'fixed',
        top: resolvedMenuCoords.top,
        left: resolvedMenuCoords.left,
        right: 'auto',
        minWidth: 220,
        zIndex: 'var(--z-card-menu-dropdown)'
      }
    : undefined;

  const renderMovePopover = (className = '') => (
    <div
      ref={movePopoverRef}
      className={`card-move-popover ${isTouchViewport ? 'is-touch-portal' : ''} ${className}`.trim()}
      style={movePopoverStyle}
    >
      <div className="card-move-title">{t('card.move.title')}</div>
      <label className="card-move-label">
        {t('card.move.list')}
        <select
          className="form-input"
          value={moveListId}
          onChange={(e) => setMoveListId(Number(e.target.value))}
        >
          {activeLists.map(list => (
            <option key={list.id} value={list.id}>{list.title}</option>
          ))}
        </select>
      </label>
      <label className="card-move-label">
        {t('card.move.position')}
        <select
          className="form-input"
          value={Math.min(movePosition, maxPosition)}
          onChange={(e) => setMovePosition(Number(e.target.value))}
        >
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </label>
      <button type="button" className="btn-primary btn-sm card-move-btn" onClick={handleMove}>
        {t('card.move.button')}
      </button>
    </div>
  );

  const shouldPortal = typeof document !== 'undefined';

  const menuNode = isMenuOpen ? (
    <div
      ref={menuDropdownRef}
      className={`card-menu-dropdown ${isTouchViewport ? 'is-touch-portal' : ''}`.trim()}
      role="menu"
      aria-label={t('card.menu')}
      style={menuDropdownStyle}
    >
      <button
        type="button"
        className="card-menu-item"
        role="menuitem"
        onClick={() => {
          if (isCardMember) onLeaveCard?.();
          else onJoinCard?.();
          closeHeaderMenus();
        }}
      >
        <span className="card-menu-icon"><FiUserPlus aria-hidden="true" /></span>
        {isCardMember ? t('card.sidebar.leave') : t('card.sidebar.join')}
      </button>
      <button
        type="button"
        className="card-menu-item"
        role="menuitem"
        onClick={() => {
          openMovePopover('menu');
        }}
        disabled={!canMoveCard}
      >
        <span className="card-menu-icon"><FiMove aria-hidden="true" /></span>
        {t('card.menu.move')}
      </button>
      <button type="button" className="card-menu-item" role="menuitem" onClick={() => { onCopyCard(); closeHeaderMenus(); }}>
        <span className="card-menu-icon"><FiCopy aria-hidden="true" /></span>
        {t('card.menu.copy')}
      </button>
      <button type="button" className="card-menu-item" role="menuitem" onClick={() => { onCopyLink(); closeHeaderMenus(); }}>
        <span className="card-menu-icon"><FiLink2 aria-hidden="true" /></span>
        {t('card.menu.share')}
      </button>
      <button type="button" className="card-menu-item" role="menuitem" onClick={() => { onArchiveToggle(); closeHeaderMenus(); }}>
        <span className="card-menu-icon"><FiArchive aria-hidden="true" /></span>
        {t('card.menu.archive')}
      </button>
      <div className="card-menu-divider" />
      <button
        type="button"
        className="card-menu-item danger"
        role="menuitem"
        onClick={() => {
          if (confirmAction(t('confirm.deleteCard'))) {
            onDeleteCard();
            closeHeaderMenus();
          }
        }}
      >
        <span className="card-menu-icon"><FiTrash2 aria-hidden="true" /></span>
        {t('card.menu.delete')}
      </button>
    </div>
  ) : null;

  const moveNode = isMoveOpen && canMoveCard
    ? renderMovePopover(movePopoverSource === 'list' ? 'card-list-move-popover' : '')
    : null;

  return (
    <div className="card-modal-header">
      <div className="card-modal-header-top">
        <div className="card-modal-header-left">
          {onOpenCover && (
            <button
              type="button"
              className="btn-icon card-header-icon"
              onClick={() => {
                onOpenCover();
                closeHeaderMenus();
              }}
              title={t('card.cover.title')}
              aria-label={t('card.cover.title')}
            >
              <FiImage aria-hidden="true" />
            </button>
          )}
          <div className="card-list-pill-wrapper">
            <button
              ref={listPillRef}
              type="button"
              className="card-list-pill"
              title={listTitle}
              onClick={() => {
                if (isMoveOpen && movePopoverSource === 'list') {
                  closeHeaderMenus();
                } else {
                  openMovePopover('list');
                }
              }}
            >
              {listTitle}
              <span className="card-list-pill-caret"><FiChevronDown aria-hidden="true" /></span>
            </button>
          </div>
        </div>
        <div className="card-modal-header-actions">
          <div className="card-menu-wrapper">
            <button
              ref={menuTriggerRef}
              type="button"
              className="btn-icon card-menu-trigger"
              onClick={() => {
                if (isMenuOpen) {
                  setIsMenuOpen(false);
                } else {
                  onOpenHeaderMenu?.();
                  setIsMoveOpen(false);
                  setMovePopoverSource(null);
                  if (!isTouchViewport) {
                    setMenuCoords(getPopoverCoords(menuTriggerRef.current, 220, false));
                  }
                  setIsMenuOpen(true);
                }
              }}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              aria-label={t('card.menu')}
              title={t('card.menu')}
            >
              <FiMoreHorizontal aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            <FiX aria-hidden="true" />
          </button>
        </div>
      </div>
      {menuNode && (shouldPortal ? createPortal(menuNode, document.body) : menuNode)}
      {moveNode && (shouldPortal ? createPortal(moveNode, document.body) : moveNode)}
      <div className="card-modal-header-main">
        <div className="card-title-row">
          <button
            type="button"
            className={`card-status-toggle ${card.is_completed ? 'done' : ''}`}
            aria-label={card.is_completed ? t('card.uncomplete') : t('card.complete')}
            onClick={() => canEdit && onUpdateCard({ is_completed: !card.is_completed })}
            disabled={!canEdit}
          >
            {card.is_completed ? <FiCheckCircle aria-hidden="true" /> : <FiCircle aria-hidden="true" />}
          </button>
          <input 
              className="card-title-input"
              value={card.title}
              onChange={e => onUpdateCard({ title: e.target.value })}
              disabled={!canEdit}
              style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'text' : 'not-allowed' }}
          />
        </div>
        <div className="card-member-row-inline">
            {card.members && card.members.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 4 }}>{t('card.members')}:</span>
                    {card.members.map(member => (
                        <div key={member.id} className="member-avatar card-member-avatar-mini" title={member.username}>
                            <img
                              src={getAvatarSrc(member)}
                              alt={member.username}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = fallbackAvatar;
                              }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
