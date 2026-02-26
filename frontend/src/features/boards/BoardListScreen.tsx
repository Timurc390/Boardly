import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHelpCircle, FiPlus, FiX } from 'shared/ui/fiIcons';
import { BoardCard } from './components/BoardCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useI18n } from '../../context/I18nContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { createBoardAction, fetchBoardsAction } from '../../store/slices/boardSlice';
import { useDialogA11y } from '../../shared/hooks/useDialogA11y';
import { validateImageFile } from '../../shared/utils/fileValidation';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const BOARD_LIST_BACKGROUND_KEY = 'boardly.boards.background';
const DEFAULT_BOARDS_BACKGROUND = '/board-backgrounds/board-default.jpg';

export const BoardListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAppSelector(state => state.auth);
  const { boards, boardsLoading } = useAppSelector((state) => state.board);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

  const [dashboardBackground, setDashboardBackground] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_BOARDS_BACKGROUND;
    return window.localStorage.getItem(BOARD_LIST_BACKGROUND_KEY) || DEFAULT_BOARDS_BACKGROUND;
  });
  const [pendingBackground, setPendingBackground] = useState<string>(dashboardBackground);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);
  const backgroundModalRef = useRef<HTMLDivElement | null>(null);

  const rawAvatarUrl = user?.profile?.avatar_url || '';
  const rawAvatarPath = user?.profile?.avatar || '';
  const resolvedAvatarUrl = useMemo(() => {
    return resolveMediaUrl(rawAvatarUrl || rawAvatarPath);
  }, [rawAvatarPath, rawAvatarUrl]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [resolvedAvatarUrl]);

  useEffect(() => {
    dispatch(fetchBoardsAction());
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BOARD_LIST_BACKGROUND_KEY, dashboardBackground);
  }, [dashboardBackground]);

  const dashboardBackgroundStyle = useMemo(() => {
    const value = dashboardBackground || DEFAULT_BOARDS_BACKGROUND;
    const isColorBackground = value.startsWith('#');
    const isGradientBackground = value.startsWith('linear-gradient') || value.startsWith('radial-gradient');
    return {
      backgroundColor: isColorBackground ? value : undefined,
      backgroundImage: !isColorBackground
        ? (isGradientBackground ? value : `url(${value})`)
        : undefined,
      backgroundSize: !isColorBackground && !isGradientBackground ? 'cover' : undefined,
      backgroundPosition: !isColorBackground && !isGradientBackground ? 'center' : undefined,
      backgroundRepeat: !isColorBackground && !isGradientBackground ? 'no-repeat' : undefined,
    } as React.CSSProperties;
  }, [dashboardBackground]);

  const filteredBoards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return boards;
    return boards.filter(board => board.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const imageOptions = useMemo(
    () =>
      Array.from({ length: 15 }, (_, index) => {
        const id = String(index + 1).padStart(2, '0');
        return `/board-backgrounds/board-${id}.jpg`;
      }),
    []
  );
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setIsCreating(true);
    try {
      await dispatch(createBoardAction(newBoardTitle)).unwrap();
      setNewBoardTitle('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(t('toast.boardCreateFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackgroundUpload = useCallback((file?: File | null) => {
    if (!file) return;
    const validation = validateImageFile(file, { maxMb: 5 });
    if (!validation.valid) {
      if (validation.error === 'invalid_type') {
        alert(t('board.background.invalidFile'));
        return;
      }
      if (validation.error === 'too_large') {
        alert(t('board.background.tooLarge', { size: String(validation.maxMb) }));
        return;
      }
      alert(t('board.background.invalidFile'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingBackground(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, [t]);

  const closeAccountPanel = useCallback(() => {
    setIsAccountOpen(false);
  }, []);

  const closeBackgroundModal = useCallback(() => {
    setIsBackgroundModalOpen(false);
  }, []);

  const openBackgroundModal = useCallback(() => {
    setPendingBackground(dashboardBackground || DEFAULT_BOARDS_BACKGROUND);
    closeAccountPanel();
    setIsBackgroundModalOpen(true);
  }, [closeAccountPanel, dashboardBackground]);

  useDialogA11y({
    isOpen: isAccountOpen && !isBackgroundModalOpen,
    onClose: closeAccountPanel,
    dialogRef: accountPanelRef,
  });
  useDialogA11y({
    isOpen: isBackgroundModalOpen,
    onClose: closeBackgroundModal,
    dialogRef: backgroundModalRef,
  });

  const handleSwitchAccount = () => {
    dispatch(logoutUser());
    closeAccountPanel();
    navigate('/auth');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    closeAccountPanel();
  };

  const userName = useMemo(() => {
    if (!user) return 'Boardly';
    const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return full || user.username;
  }, [user]);
  const userInitial = (user?.username?.charAt(0) || 'B').toUpperCase();
  const featuredBoards = filteredBoards.slice(0, 5);
  const remainingBoards = filteredBoards.slice(5);

  if (boardsLoading) {
    return <div className="loading-state">{t('common.loading')}</div>;
  }

  return (
    <div className="board-list-page">
      <div className="boards-hub-bg" style={dashboardBackgroundStyle} />
      <div className="boards-hub-backdrop" />

      <div className="board-list-shell">
        <header className="boards-hub-header">
          <Link to="/" className="boards-hub-logo">Boardly</Link>
          <div className="boards-hub-toolbar">
            <div className="boards-hub-search">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t('common.search')}...`}
                aria-label={t('common.search')}
              />
            </div>
            <button
              type="button"
              className="boards-hub-avatar-trigger"
              onClick={() => setIsAccountOpen(prev => !prev)}
              aria-label={t('nav.profile')}
            >
              {resolvedAvatarUrl && !avatarFailed ? (
                <img src={resolvedAvatarUrl} alt={userName} loading="lazy" decoding="async" onError={() => setAvatarFailed(true)} />
              ) : (
                <span>{userInitial}</span>
              )}
            </button>
          </div>
        </header>

        <section className="boards-hub-main">
          <div className="boards-grid boards-hub-grid">
            {featuredBoards.map(board => (
              <BoardCard key={board.id} board={board} />
            ))}

            <button
              className="board-card create-board-card boards-hub-create"
              onClick={() => setIsModalOpen(true)}
            >
              <FiPlus aria-hidden="true" style={{ fontSize: '24px', lineHeight: 1 }} />
              <span>{t('common.create')}</span>
            </button>

            {remainingBoards.map(board => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </section>

        <Link to="/help" className="board-floating-help" aria-label={t('nav.help')} title={t('nav.help')}>
          <FiHelpCircle aria-hidden="true" />
        </Link>
      </div>

      {isAccountOpen && (
        <>
          <button className="boards-account-overlay" onClick={closeAccountPanel} aria-label={t('common.close')} />
          <div
            ref={accountPanelRef}
            className="boards-account-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="boards-account-title"
            tabIndex={-1}
          >
            <div className="boards-account-header">
              <span id="boards-account-title">{t('board.account.title')}</span>
              <button type="button" className="boards-account-close" onClick={closeAccountPanel} aria-label={t('common.close')}>
                <FiX aria-hidden="true" />
              </button>
            </div>
            <div className="boards-account-user">
              <div className="boards-account-avatar">
                {resolvedAvatarUrl && !avatarFailed ? (
                  <img src={resolvedAvatarUrl} alt={userName} loading="lazy" decoding="async" onError={() => setAvatarFailed(true)} />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="boards-account-user-copy">
                <strong>{userName}</strong>
                <span>{user?.email || ''}</span>
              </div>
            </div>
            <div className="boards-account-list">
              <button type="button" className="boards-account-item" onClick={handleSwitchAccount}>
                {t('board.account.changeAccount')}
              </button>
              <button
                type="button"
                className="boards-account-item"
                onClick={() => {
                  closeAccountPanel();
                  navigate('/profile');
                }}
              >
                {t('board.account.profile')}
              </button>
              <button
                type="button"
                className="boards-account-item"
                onClick={() => {
                  closeAccountPanel();
                  navigate('/profile?tab=settings');
                }}
              >
                {t('board.account.settings')}
              </button>
              <button
                type="button"
                className="boards-account-item"
                onClick={openBackgroundModal}
              >
                {t('board.account.backgrounds')}
              </button>
              <div className="boards-account-divider" />
              <button type="button" className="boards-account-item danger" onClick={handleLogout}>
                {t('board.account.logout')}
              </button>
            </div>
          </div>
        </>
      )}

      {isBackgroundModalOpen && (
        <>
          <button
            className="boards-background-overlay"
            onClick={closeBackgroundModal}
            aria-label={t('common.close')}
          />
          <div
            ref={backgroundModalRef}
            className="boards-background-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="boards-background-title"
            tabIndex={-1}
          >
            <div className="boards-background-header">
              <div className="boards-background-header-copy">
                <h3 id="boards-background-title">{t('board.background.title')}</h3>
                <p>{t('board.background.urlPlaceholder')}</p>
              </div>
              <button type="button" className="boards-account-close" onClick={closeBackgroundModal} aria-label={t('common.close')}>
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className="boards-background-group">
              <h4>{t('board.background.images')}</h4>
              <div className="boards-background-grid">
                {imageOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`boards-background-option ${pendingBackground === option ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${option})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    onClick={() => setPendingBackground(option)}
                    aria-label={option}
                  />
                ))}
              </div>
            </div>

            <div className="boards-background-actions">
              <div className="boards-background-buttons">
                <label className="btn-secondary" style={{ width: 'auto', cursor: 'pointer' }}>
                  {t('board.background.upload')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleBackgroundUpload(e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto' }}
                  onClick={() => {
                    setDashboardBackground(pendingBackground || DEFAULT_BOARDS_BACKGROUND);
                    closeBackgroundModal();
                  }}
                >
                  {t('common.save')}
                </button>
              </div>
              <p className="boards-background-hint">{t('board.background.uploadHint')}</p>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('common.create')}
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">{t('board.create.titleLabel')}</label>
            <Input
              autoFocus
              placeholder={t('board.create.titleInputPlaceholder')}
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <Button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="btn-primary" disabled={isCreating}>
              {isCreating ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
