import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMenu, FiSearch } from 'shared/ui/fiIcons';
import { LanguageSelect } from '../../../components/LanguageSelect';
import { useI18n } from '../../../context/I18nContext';
import { Board, User } from '../../../types';
import { BoardHeaderMembers } from './board_header/BoardHeaderMembers';

type BoardMember = NonNullable<Board['members']>[number];
type HeaderMember = { user: User; membership?: BoardMember };

interface BoardHeaderProps {
  board: Board;
  boardTitle: string;
  canEditBoard: boolean;
  onBoardTitleChange: (value: string) => void;
  onBoardTitleBlur: () => void;
  onToggleFavorite: () => void;
  boardIconSrc: string;
  boardIconLetter: string;
  boardIconFailed: boolean;
  onBoardIconError: () => void;
  isGlobalMenuOpen: boolean;
  onToggleGlobalMenu: () => void;
  onCloseGlobalMenu: () => void;
  onLogout: () => void;
  headerMembers: HeaderMember[];
  visibleMembers: User[];
  extraMembersCount: number;
  headerMemberId: number | null;
  onToggleHeaderMember: (id: number | null) => void;
  onCloseHeaderMember: () => void;
  getAvatarSrc: (profile?: { avatar_url?: string | null; avatar?: string | null }) => string;
  fallbackAvatar: string;
  getMemberDisplayName: (user: User) => string;
  canManageMembers: boolean;
  ownerId?: number;
  currentUserId?: number;
  onOpenMemberActivity: (member: BoardMember) => void;
  onToggleMemberRole: (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => void;
  onRemoveMember: (membershipId: number) => void;
  filterQuery: string;
  onSearchChange: (value: string) => void;
  onOpenFilter: () => void;
  onOpenMenu: () => void;
  onOpenMembersPanel: () => void;
  closeSignal?: number;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  boardTitle,
  canEditBoard,
  onBoardTitleChange,
  onBoardTitleBlur,
  onToggleFavorite,
  boardIconSrc,
  boardIconLetter,
  boardIconFailed,
  onBoardIconError,
  isGlobalMenuOpen,
  onToggleGlobalMenu,
  onCloseGlobalMenu,
  onLogout,
  headerMembers,
  visibleMembers,
  extraMembersCount,
  headerMemberId,
  onToggleHeaderMember,
  onCloseHeaderMember,
  getAvatarSrc,
  fallbackAvatar,
  getMemberDisplayName,
  canManageMembers,
  ownerId,
  currentUserId,
  onOpenMemberActivity,
  onToggleMemberRole,
  onRemoveMember,
  filterQuery,
  onSearchChange,
  onOpenFilter,
  onOpenMenu,
  onOpenMembersPanel,
  closeSignal = 0
}) => {
  const { t } = useI18n();
  const currentUserEntry = headerMembers.find(item => item.user.id === currentUserId);
  const currentUserProfile = currentUserEntry?.user;
  const currentUserName = currentUserProfile ? getMemberDisplayName(currentUserProfile) : t('nav.profile');
  const currentUserInitial = currentUserName.charAt(0).toUpperCase();
  const favoriteActionLabel = board.is_favorite ? 'Remove from favorites' : 'Add to favorites';

  return (
    <>
      <div className={`board-header ${headerMemberId ? 'member-popover-open' : ''}`}>
        <div className="board-header-main">
          <div className="board-global-menu">
            <button
              className="btn-icon board-global-menu-trigger"
              onClick={onToggleGlobalMenu}
              aria-label={t('nav.menu')}
              aria-expanded={isGlobalMenuOpen}
              aria-haspopup="menu"
            >
              <FiMenu aria-hidden="true" />
            </button>
            {isGlobalMenuOpen && (
              <>
                <div className="board-global-menu-overlay" onClick={onCloseGlobalMenu} />
                <div className="board-global-menu-dropdown" role="menu" aria-label={t('nav.menu')}>
                  <Link to="/boards" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.board')}
                  </Link>
                  <Link to="/my-cards" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.myCards')}
                  </Link>
                  <Link to="/help" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.help')}
                  </Link>
                  <Link to="/community" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.community')}
                  </Link>
                  <div className="board-global-menu-divider" />
                  <div className="board-global-menu-lang">
                    <LanguageSelect compact />
                  </div>
                  <Link to="/profile" className="board-global-menu-item" role="menuitem" onClick={onCloseGlobalMenu}>
                    {t('nav.profile')}
                  </Link>
                  <button
                    type="button"
                    className="board-global-menu-item board-global-menu-button"
                    role="menuitem"
                    onClick={() => {
                      onLogout();
                      onCloseGlobalMenu();
                    }}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
          <Link to="/boards" className="btn-icon board-back-btn" aria-label={t('nav.board')}>
            <FiArrowLeft aria-hidden="true" />
          </Link>
          <div className="board-icon" aria-hidden="true">
            {!boardIconFailed ? (
              <img src={boardIconSrc} alt="" decoding="async" onError={onBoardIconError} />
            ) : (
              <span>{boardIconLetter}</span>
            )}
          </div>
          <input 
            value={boardTitle}
            onChange={(e) => { if (canEditBoard) onBoardTitleChange(e.target.value); }}
            onBlur={() => { if (canEditBoard) onBoardTitleBlur(); }}
            readOnly={!canEditBoard}
            className="board-title-input"
            style={{ background: 'transparent', border: 'none', fontSize: '18px', fontWeight: 'bold', width: 'auto', minWidth: '100px' }}
          />
          <button 
            onClick={onToggleFavorite} 
            className="btn-icon" 
            aria-label={favoriteActionLabel}
            title={favoriteActionLabel}
            aria-pressed={board.is_favorite}
            style={{ color: board.is_favorite ? '#FFC107' : 'var(--text-secondary)', fontSize: '20px' }}
          >
            {board.is_favorite ? '★' : '☆'}
          </button>
        </div>
        <Link to="/boards" className="board-header-brand">Boardly</Link>
        <div className="board-header-toolbar">
          <BoardHeaderMembers
            headerMembers={headerMembers}
            visibleMembers={visibleMembers}
            extraMembersCount={extraMembersCount}
            headerMemberId={headerMemberId}
            onToggleHeaderMember={onToggleHeaderMember}
            onCloseHeaderMember={onCloseHeaderMember}
            getAvatarSrc={getAvatarSrc}
            fallbackAvatar={fallbackAvatar}
            getMemberDisplayName={getMemberDisplayName}
            canManageMembers={canManageMembers}
            ownerId={ownerId}
            currentUserId={currentUserId}
            onOpenMemberActivity={onOpenMemberActivity}
            onToggleMemberRole={onToggleMemberRole}
            onRemoveMember={onRemoveMember}
            onOpenMembersPanel={onOpenMembersPanel}
            closeSignal={closeSignal}
          />
          <div className="board-header-search">
            <input
              className="form-input board-search-input"
              placeholder={t('toolbar.searchPlaceholder')}
              value={filterQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t('toolbar.searchPlaceholder')}
            />
          </div>
          <div className="board-header-actions">
            <button
              className="btn-secondary board-header-action"
              onClick={onOpenFilter}
              aria-label={t('board.filters')}
            >
              <span className="board-header-action-icon"><FiSearch aria-hidden="true" /></span>
              <span className="board-header-action-label">{t('board.filters')}</span>
            </button>
            <button
              className="board-account-trigger"
              onClick={onOpenMenu}
              aria-haspopup="menu"
              aria-label={t('board.menu')}
              title={currentUserName}
            >
              {currentUserProfile ? (
                <img
                  src={getAvatarSrc(currentUserProfile.profile)}
                  alt={currentUserName}
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== fallbackAvatar) {
                      e.currentTarget.src = fallbackAvatar;
                    }
                  }}
                />
              ) : (
                <span>{currentUserInitial || boardIconLetter}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
