import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowLeft, FiX } from 'shared/ui/fiIcons';
import { useI18n } from '../../../context/I18nContext';
import { useDialogA11y } from '../../../shared/hooks/useDialogA11y';
import { type Board, type Card, type List } from '../../../types';
import { ArchivedSection } from './board_menu/ArchivedSection';
import { BackgroundSection } from './board_menu/BackgroundSection';
import { MainSection } from './board_menu/MainSection';
import { MembersSection } from './board_menu/MembersSection';
import { PermissionsSection } from './board_menu/PermissionsSection';
import { type BackgroundOption, type BoardMember, type BoardMenuTab } from './board_menu/types';

interface BoardMenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: BoardMenuTab;
  onTabChange: (tab: BoardMenuTab) => void;
  board: Board;
  inviteLink: string;
  onInvite: () => void;
  canEditBoard: boolean;
  canManageMembers: boolean;
  canLeaveBoard: boolean;
  isOwner: boolean;
  onArchiveToggle: () => void;
  onDeleteBoard: () => void;
  onLeaveBoard: () => void;
  onLogout: () => void;
  onUpdateBoardSettings: (data: Partial<Board>) => void;
  colorOptions: BackgroundOption[];
  gradientOptions: BackgroundOption[];
  imageOptions: BackgroundOption[];
  bgUrlInput: string;
  onBgUrlInputChange: (value: string) => void;
  onBackgroundSelect: (value: string) => void;
  onBackgroundFile: (file?: File | null) => void;
  memberQuery: string;
  onMemberQueryChange: (value: string) => void;
  filteredMembers: BoardMember[];
  activeMemberId: number | null;
  onToggleActiveMember: (id: number | null) => void;
  getMemberDisplayName: (user: BoardMember['user']) => string;
  getAvatarSrc: (profile?: { avatar_url?: string | null; avatar?: string | null }) => string;
  fallbackAvatar: string;
  onOpenMemberActivity: (member: BoardMember) => void;
  onToggleMemberRole: (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => void;
  onRemoveMember: (membershipId: number) => void;
  currentUserId?: number;
  archivedLists: List[];
  archivedCards: Card[];
  onUnarchiveList: (listId: number) => void;
  onDeleteList: (listId: number) => void;
  onUnarchiveCard: (cardId: number) => void;
  onDeleteCard: (cardId: number) => void;
}

export const BoardMenuSidebar: React.FC<BoardMenuSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  board,
  inviteLink,
  onInvite,
  canEditBoard,
  canManageMembers,
  canLeaveBoard,
  isOwner,
  onArchiveToggle,
  onDeleteBoard,
  onLeaveBoard,
  onLogout,
  onUpdateBoardSettings,
  colorOptions,
  gradientOptions,
  imageOptions,
  bgUrlInput,
  onBgUrlInputChange,
  onBackgroundSelect,
  onBackgroundFile,
  memberQuery,
  onMemberQueryChange,
  filteredMembers,
  activeMemberId,
  onToggleActiveMember,
  getMemberDisplayName,
  getAvatarSrc,
  fallbackAvatar,
  onOpenMemberActivity,
  onToggleMemberRole,
  onRemoveMember,
  currentUserId,
  archivedLists,
  archivedCards,
  onUnarchiveList,
  onDeleteList,
  onUnarchiveCard,
  onDeleteCard
}) => {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useDialogA11y({ isOpen, onClose, dialogRef });

  if (!isOpen) return null;

  const sidebarNode = (
    <div className="menu-sidebar-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="menu-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="menu-header">
          {activeTab !== 'main' && (
            <button type="button" className="btn-icon" onClick={() => onTabChange('main')} aria-label={t('community.back')}>
              <FiArrowLeft aria-hidden="true" />
            </button>
          )}
          <h3 id={titleId}>{t('board.menu')}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="menu-content">
          {activeTab === 'main' && (
            <MainSection
              t={t}
              board={board}
              canEditBoard={canEditBoard}
              canManageMembers={canManageMembers}
              canLeaveBoard={canLeaveBoard}
              isOwner={isOwner}
              inviteLink={inviteLink}
              onInvite={onInvite}
              onArchiveToggle={onArchiveToggle}
              onDeleteBoard={onDeleteBoard}
              onLeaveBoard={onLeaveBoard}
              onLogout={onLogout}
              onClose={onClose}
              onTabChange={onTabChange}
            />
          )}
          {activeTab === 'permissions' && (
            <PermissionsSection t={t} board={board} onUpdateBoardSettings={onUpdateBoardSettings} />
          )}
          {activeTab === 'background' && (
            <BackgroundSection
              t={t}
              board={board}
              colorOptions={colorOptions}
              gradientOptions={gradientOptions}
              imageOptions={imageOptions}
              bgUrlInput={bgUrlInput}
              onBgUrlInputChange={onBgUrlInputChange}
              onBackgroundSelect={onBackgroundSelect}
              onBackgroundFile={onBackgroundFile}
            />
          )}
          {activeTab === 'members' && (
            <MembersSection
              t={t}
              board={board}
              memberQuery={memberQuery}
              onMemberQueryChange={onMemberQueryChange}
              filteredMembers={filteredMembers}
              activeMemberId={activeMemberId}
              onToggleActiveMember={onToggleActiveMember}
              getMemberDisplayName={getMemberDisplayName}
              getAvatarSrc={getAvatarSrc}
              fallbackAvatar={fallbackAvatar}
              onOpenMemberActivity={onOpenMemberActivity}
              onToggleMemberRole={onToggleMemberRole}
              onRemoveMember={onRemoveMember}
              canManageMembers={canManageMembers}
              currentUserId={currentUserId}
            />
          )}
          {activeTab === 'archived' && (
            <ArchivedSection
              t={t}
              board={board}
              archivedLists={archivedLists}
              archivedCards={archivedCards}
              onUnarchiveList={onUnarchiveList}
              onDeleteList={onDeleteList}
              onUnarchiveCard={onUnarchiveCard}
              onDeleteCard={onDeleteCard}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(sidebarNode, document.body);
  }

  return sidebarNode;
};
