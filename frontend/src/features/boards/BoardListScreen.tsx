import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BoardCard } from './components/BoardCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useI18n } from '../../context/I18nContext';
import * as api from './api';
import { Board } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser, updateUserProfile } from '../../store/slices/authSlice';

const BOARD_LIST_BACKGROUND_KEY = 'boardly.boards.background';
const DEFAULT_BOARDS_BACKGROUND = '/board-backgrounds/board-default.jpg';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
};

export const BoardListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAppSelector(state => state.auth);

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  });
  const [avatarFailed, setAvatarFailed] = useState(false);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);
  const backgroundModalRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nextTheme = user?.profile?.theme === 'light' ? 'light' : user?.profile?.theme === 'dark' ? 'dark' : null;
    if (nextTheme) setTheme(nextTheme);
  }, [user?.profile?.theme]);

  const rawAvatarUrl = user?.profile?.avatar_url || '';
  const rawAvatarPath = user?.profile?.avatar || '';
  const resolvedAvatarUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const preferPath = rawAvatarUrl && origin.startsWith('https://') && rawAvatarUrl.startsWith('http://');
    const candidate = preferPath ? (rawAvatarPath || rawAvatarUrl) : (rawAvatarUrl || rawAvatarPath);
    if (!candidate) return '';
    if (candidate.startsWith('data:')) return candidate;
    if (candidate.startsWith('http')) {
      try {
        const url = new URL(candidate);
        if (origin) {
          const originUrl = new URL(origin);
          const mixedContent = originUrl.protocol === 'https:' && url.protocol === 'http:';
          const differentHost = url.host !== originUrl.host;
          if ((mixedContent || differentHost) && url.pathname) {
            return `${originUrl.origin}${url.pathname}`;
          }
        }
      } catch {
        return candidate;
      }
      return candidate;
    }
    if (candidate.startsWith('/')) return origin ? `${origin}${candidate}` : candidate;
    return candidate;
  }, [rawAvatarPath, rawAvatarUrl]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [resolvedAvatarUrl]);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const data = await api.getBoards();
        setBoards(data);
      } catch (error) {
        console.error('Failed to fetch boards', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

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
  const applyTheme = useCallback((nextTheme: 'dark' | 'light') => {
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = nextTheme;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', nextTheme);
    }
    if (user && user.profile?.theme !== nextTheme) {
      dispatch(updateUserProfile({ profile: { theme: nextTheme } }));
    }
  }, [dispatch, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setIsCreating(true);
    try {
      const newBoard = await api.createBoard(newBoardTitle);
      setBoards(prev => [...prev, newBoard]);
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
    if (!file.type.startsWith('image/')) {
      alert(t('board.background.invalidFile'));
      return;
    }
    const maxMb = 5;
    if (file.size > maxMb * 1024 * 1024) {
      alert(t('board.background.tooLarge', { size: String(maxMb) }));
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

  useEffect(() => {
    const isAnyDialogOpen = isAccountOpen || isBackgroundModalOpen;
    if (!isAnyDialogOpen || typeof document === 'undefined' || typeof window === 'undefined') return;

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const dialogNode = isBackgroundModalOpen ? backgroundModalRef.current : accountPanelRef.current;
    const raf = window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(dialogNode);
      (firstFocusable || dialogNode)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isBackgroundModalOpen) {
          closeBackgroundModal();
        } else {
          closeAccountPanel();
        }
        return;
      }

      if (event.key !== 'Tab') return;
      const currentDialog = isBackgroundModalOpen ? backgroundModalRef.current : accountPanelRef.current;
      const focusable = getFocusableElements(currentDialog);
      if (!focusable.length) {
        event.preventDefault();
        currentDialog?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(raf);
      lastActiveElementRef.current?.focus();
      lastActiveElementRef.current = null;
    };
  }, [closeAccountPanel, closeBackgroundModal, isAccountOpen, isBackgroundModalOpen]);

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

  if (isLoading) {
    return <div className="loading-state">{t('common.loading')}</div>;
  }

  return (
    <div className="board-list-page">
      <div className="boards-hub-bg" style={dashboardBackgroundStyle} />
      <div className="boards-hub-backdrop" />

      <div className="board-list-shell">
        <header className="boards-hub-header">
          <Link to="/boards" className="boards-hub-logo">Boardly</Link>
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
              <span style={{ fontSize: '24px', lineHeight: 1 }}>+</span>
              <span>{t('common.create')}</span>
            </button>

            {remainingBoards.map(board => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </section>

        <Link to="/help" className="board-floating-help" aria-label={t('nav.help')} title={t('nav.help')}>
          ?
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
              <button type="button" className="boards-account-close" onClick={closeAccountPanel} aria-label={t('common.close')}>✕</button>
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
                ✕
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
              <div className="boards-theme-toggle boards-modal-theme-toggle">
                <button
                  type="button"
                  className={`boards-theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => applyTheme('light')}
                >
                  {t('profile.theme.light')}
                </button>
                <button
                  type="button"
                  className={`boards-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => applyTheme('dark')}
                >
                  {t('profile.theme.dark')}
                </button>
              </div>
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
