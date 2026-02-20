import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiUser, FiShield, FiSettings, FiClock, FiArrowLeft } from 'react-icons/fi';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { ActivityLog } from '../types';
import { useI18n } from '../context/I18nContext';
import { type Locale } from '../i18n/translations';
import { getProfilePrivacyContent } from '../content/profilePrivacyContent';
import { resolveMediaUrl } from '../utils/mediaUrl';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  updateUserProfile, 
  uploadUserAvatar, 
  logoutUser, 
  requestUserPasswordChange,
  deleteUserAccount,
  sendEmailVerification
} from '../store/slices/authSlice';

const API_URL = process.env.REACT_APP_API_URL || '/api';

type TabKey = 'profile' | 'activity' | 'settings' | 'privacy';

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  profile: 'profile.tabs.profile',
  activity: 'profile.tabs.activity',
  privacy: 'profile.tabs.privacy',
  settings: 'profile.tabs.settings',
};

const castIcon = (Icon: unknown) => Icon as React.FC<React.SVGProps<SVGSVGElement>>;

const TAB_ICONS: Record<TabKey, React.FC<React.SVGProps<SVGSVGElement>>> = {
  profile: castIcon(FiUser),
  activity: castIcon(FiClock),
  privacy: castIcon(FiShield),
  settings: castIcon(FiSettings),
};

const BackIcon = castIcon(FiArrowLeft);

const formatEntity = (name?: string, id?: number | null) => {
  if (name) return `«${name}»`;
  if (id) return `#${id}`;
  return '';
};

const getUserName = (log: ActivityLog, fallback: string) => {
  const u = (log as any).user;
  if (!u) return fallback;
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return full || u.username || u.email || fallback;
};

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

const useDialogA11y = (
  isOpen: boolean,
  onClose: () => void,
  dialogRef: React.RefObject<HTMLDivElement | null>
) => {
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined' || typeof window === 'undefined') return;

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const raf = window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(dialogRef.current);
      (firstFocusable || dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(dialogRef.current);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
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
  }, [dialogRef, isOpen, onClose]);
};

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = () => {
    dispatch(logoutUser());
  };

  const updateProfile = async (data: Partial<any>) => {
    return dispatch(updateUserProfile(data));
  };

  const uploadAvatar = async (file: File) => {
    return dispatch(uploadUserAvatar(file)).unwrap();
  };
  const { user, token } = useAppSelector(state => state.auth);
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [settingsPrefs, setSettingsPrefs] = useState({
    desktopNotifications: true,
    assignedToTask: true,
    dueDateApproaching: true,
    addedToBoard: true,
  });
  const [isEmailPrefsOpen, setIsEmailPrefsOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isPasswordInstructionsOpen, setIsPasswordInstructionsOpen] = useState(false);
  const [isMobileSettingsMenuOpen, setIsMobileSettingsMenuOpen] = useState(false);
  const emailPrefsDialogRef = useRef<HTMLDivElement>(null);
  const integrationsDialogRef = useRef<HTMLDivElement>(null);
  const passwordInstructionsDialogRef = useRef<HTMLDivElement>(null);
  const deactivateDialogRef = useRef<HTMLDivElement>(null);
  const closeEmailPrefs = useCallback(() => setIsEmailPrefsOpen(false), []);
  const closeIntegrations = useCallback(() => setIsIntegrationsOpen(false), []);
  const closePasswordInstructions = useCallback(() => setIsPasswordInstructionsOpen(false), []);
  const closeDeactivate = useCallback(() => setIsDeactivateOpen(false), []);

  useDialogA11y(isEmailPrefsOpen, closeEmailPrefs, emailPrefsDialogRef);
  useDialogA11y(isIntegrationsOpen, closeIntegrations, integrationsDialogRef);
  useDialogA11y(isPasswordInstructionsOpen, closePasswordInstructions, passwordInstructionsDialogRef);
  useDialogA11y(isDeactivateOpen, closeDeactivate, deactivateDialogRef);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'profile' || tab === 'activity' || tab === 'settings' || tab === 'privacy') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    setIsMobileSettingsMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('settingsPrefs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettingsPrefs(prev => ({ ...prev, ...parsed }));
      } catch {
        // ignore malformed cache
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('settingsPrefs', JSON.stringify(settingsPrefs));
  }, [settingsPrefs]);

  // Form State
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    organization: '',
    bio: '',
    theme: 'dark', // За замовчуванням темна
    language: 'uk',
    notify_email: true,
    activity_retention: '30d',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        organization: user.profile?.organization || '',
        bio: user.profile?.bio || '',
        theme: 'dark',
        language: user.profile?.language || 'uk',
        notify_email: user.profile?.notify_email ?? true,
        activity_retention: user.profile?.activity_retention || '30d',
      });
      setSettingsPrefs(prev => ({
        ...prev,
        desktopNotifications: user.profile?.notify_desktop ?? prev.desktopNotifications,
        assignedToTask: user.profile?.notify_assigned ?? prev.assignedToTask,
        dueDateApproaching: user.profile?.notify_due ?? prev.dueDateApproaching,
        addedToBoard: user.profile?.notify_added ?? prev.addedToBoard,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = 'dark';
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', 'dark');
    }
  }, [form.theme]);

  // Fetch Activity Logs
  useEffect(() => {
    if (activeTab === 'activity' && token) {
      setLoadingActivity(true);
      axios.get(`${API_URL}/activity/`, {
        headers: { Authorization: `Token ${token}` }
      })
      .then(res => setActivityLogs(res.data))
      .catch(console.error)
      .finally(() => setLoadingActivity(false));
    }
  }, [activeTab, token]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearCache = async () => {
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : null;
      const storedLocale = typeof window !== 'undefined' ? window.localStorage.getItem('locale') : null;
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        if (token) window.localStorage.setItem('authToken', token);
        if (storedLocale) window.localStorage.setItem('locale', storedLocale);
        if (form.theme) window.localStorage.setItem('theme', form.theme);
        if ('caches' in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        }
      }
      showToast(t('profile.settings.cacheCleared'));
    } catch {
      showToast(t('common.error'));
    }
  };

  const handleComingSoon = () => {
    showToast(t('profile.settings.comingSoon'));
  };

  const handleClearActivity = async () => {
    if (!token) return;
    setLoadingActivity(true);
    try {
      await axios.post(
        `${API_URL}/activity/clear/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setActivityLogs([]);
      showToast('Activity cleared');
    } catch (e) {
      console.error(e);
      showToast(t('common.error'));
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const emailChanged = form.email !== (user?.email || '');
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        profile: {
          organization: form.organization,
          bio: form.bio,
          theme: 'dark',
          language: form.language as Locale, // ВИПРАВЛЕНО: Явне приведення типу для TypeScript
          notify_email: form.notify_email,
          activity_retention: form.activity_retention as '7d' | '30d' | '365d',
          notify_desktop: settingsPrefs.desktopNotifications,
          notify_assigned: settingsPrefs.assignedToTask,
          notify_due: settingsPrefs.dueDateApproaching,
          notify_added: settingsPrefs.addedToBoard,
        }
      });
      
      // Update local locale if changed
      if (form.language !== locale) {
        setLocale(form.language as Locale);
      }

      if (emailChanged) {
        try {
          await dispatch(sendEmailVerification(form.email)).unwrap();
        } catch {
          showToast(t('common.error'));
        }
      }
      
      showToast(t('profile.toast.saved'));
    } catch (e) {
      console.error(e);
      showToast(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        await uploadAvatar(e.target.files[0]);
        setAvatarFailed(false);
        setAvatarCacheBuster(Date.now());
        showToast(t('profile.toast.avatarUpdated'));
      } catch {
        showToast(t('common.error'));
      } finally {
        e.target.value = '';
      }
    }
  };

  const handlePasswordChange = async () => {
    const requireCurrentPassword = user?.profile?.password_initialized !== false;
    if ((!passwordForm.current_password && requireCurrentPassword) || !passwordForm.new_password || !passwordForm.confirm_password) {
      showToast(t('common.error'));
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast(t('resetConfirm.errorMismatch'));
      return;
    }
    try {
      await dispatch(requestUserPasswordChange({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        re_new_password: passwordForm.confirm_password,
      })).unwrap();
      setIsPasswordInstructionsOpen(true);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (e: any) {
      console.error(e);
      const payload = e?.payload ?? e;
      if (typeof payload === 'string') {
        showToast(payload);
        return;
      }
      if (payload?.detail) {
        showToast(String(payload.detail));
        return;
      }
      if (Array.isArray(payload?.non_field_errors) && payload.non_field_errors.length) {
        showToast(String(payload.non_field_errors[0]));
        return;
      }
      const firstKey = payload && typeof payload === 'object' ? Object.keys(payload)[0] : null;
      if (firstKey && Array.isArray(payload[firstKey]) && payload[firstKey].length) {
        showToast(String(payload[firstKey][0]));
        return;
      }
      showToast(t('common.error'));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await dispatch(deleteUserAccount()).unwrap();
      await dispatch(logoutUser());
      navigate('/');
    } catch (e) {
      console.error(e);
      showToast(t('common.error'));
    }
  };

  const rawAvatarUrl = user?.profile?.avatar_url || '';
  const rawAvatarPath = user?.profile?.avatar || '';
  const resolvedAvatarUrl = React.useMemo(() => {
    return resolveMediaUrl(rawAvatarUrl || rawAvatarPath);
  }, [rawAvatarUrl, rawAvatarPath]);
  const resolvedAvatarUrlWithBuster = React.useMemo(() => {
    if (!resolvedAvatarUrl) return '';
    if (resolvedAvatarUrl.startsWith('data:')) return resolvedAvatarUrl;
    const separator = resolvedAvatarUrl.includes('?') ? '&' : '?';
    return `${resolvedAvatarUrl}${separator}v=${avatarCacheBuster}`;
  }, [resolvedAvatarUrl, avatarCacheBuster]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [resolvedAvatarUrl]);

  // Helper for activity messages
  const getActivityMessage = (log: ActivityLog) => {
    const meta = log.meta || {};
    const actor = getUserName(log, t('profile.userFallback'));
    const title = meta.title as string | undefined;
    const itemText = meta.item_text as string | undefined;
    const boardId = meta.board_id as number | undefined;
    const listId = meta.list as number | undefined;
    const fromList = meta.from_list as number | undefined;
    const toList = meta.to_list as number | undefined;
    const cardId = meta.card_id as number | undefined;
    const listTitle = meta.list_title as string | undefined;
    const fromListTitle = meta.from_list_title as string | undefined;
    const toListTitle = meta.to_list_title as string | undefined;
    const boardTitle = meta.board_title as string | undefined;
    const dueBefore = meta.due_before as string | undefined;
    const dueAfter = meta.due_after as string | undefined;
    const addedLabels = meta.added_labels as string[] | undefined;
    const removedLabels = meta.removed_labels as string[] | undefined;
    const labelName = meta.label_name as string | undefined;
    const commentText = meta.comment_text as string | undefined;
    const originalTitle = meta.original_title as string | undefined;
    const checklistTitle = meta.checklist_title as string | undefined;

    const space = (value?: string) => value ? ` ${value}` : '';
    const boardContext = space(boardTitle || boardId ? t('activity.context.onBoard', { board: formatEntity(boardTitle, boardId) }) : '');
    const toListContext = space(listTitle || listId ? t('activity.context.toList', { list: formatEntity(listTitle, listId) }) : '');
    const moveToListContext = space(toListTitle || toList ? t('activity.context.toList', { list: formatEntity(toListTitle, toList) }) : '');
    const fromListContext = space(fromListTitle || fromList ? t('activity.context.fromList', { list: formatEntity(fromListTitle, fromList) }) : '');
    const inListContext = space(listTitle || listId ? t('activity.context.inList', { list: formatEntity(listTitle, listId) }) : '');
    const checklistContext = space(checklistTitle || meta.checklist_id ? t('activity.context.inChecklist', { checklist: formatEntity(checklistTitle, meta.checklist_id) }) : '');
    const cardContext = space(title || cardId ? t('activity.context.onCard', { card: formatEntity(title, cardId) }) : '');

    switch (log.action) {
      case 'create_board':
        return t('activity.create_board', { actor, board: formatEntity(title, boardId) }).trim();
      case 'rename_board':
        return t('activity.rename_board', { actor, board: formatEntity(title, boardId) }).trim();
      case 'update_board':
        return t('activity.update_board', { actor, board: formatEntity(title, boardId) }).trim();
      case 'archive_board':
        return t('activity.archive_board', { actor, board: formatEntity(title, boardId) }).trim();
      case 'unarchive_board':
        return t('activity.unarchive_board', { actor, board: formatEntity(title, boardId) }).trim();

      case 'create_list':
        return t('activity.create_list', { actor, list: formatEntity(title, log.entity_id), context: boardContext }).trim();
      case 'rename_list':
        return t('activity.rename_list', { actor, list: formatEntity(title, log.entity_id) }).trim();
      case 'move_list':
        return t('activity.move_list', { actor, list: formatEntity(title, log.entity_id), context: boardContext }).trim();
      case 'archive_list':
        return t('activity.archive_list', { actor, list: formatEntity(title, log.entity_id) }).trim();
      case 'unarchive_list':
        return t('activity.unarchive_list', { actor, list: formatEntity(title, log.entity_id) }).trim();
      case 'copy_list':
        return t('activity.copy_list', { actor, source: formatEntity(originalTitle, meta.original_id), target: formatEntity(title, log.entity_id) }).trim();

      case 'create_card':
        return t('activity.create_card', { actor, card: formatEntity(title, cardId), context: toListContext }).trim();
      case 'move_card':
        return t('activity.move_card', { actor, card: formatEntity(title, cardId), from: fromListContext, to: moveToListContext }).trim();
      case 'archive_card':
        return t('activity.archive_card', { actor, card: formatEntity(title, cardId), context: inListContext }).trim();
      case 'unarchive_card':
        return t('activity.unarchive_card', { actor, card: formatEntity(title, cardId), context: inListContext }).trim();
      case 'update_card':
        return t('activity.update_card', { actor, card: formatEntity(title, cardId) }).trim();
      case 'update_card_description':
        return t('activity.update_card_description', { actor, card: formatEntity(title, cardId) }).trim();
      case 'update_card_due_date': {
        const before = dueBefore ? new Date(dueBefore).toLocaleString(locale) : t('activity.noDate');
        const after = dueAfter ? new Date(dueAfter).toLocaleString(locale) : t('activity.noDate');
        return t('activity.update_card_due_date', { actor, card: formatEntity(title, cardId), before, after }).trim();
      }
      case 'copy_card':
        return t('activity.copy_card', { actor, source: formatEntity(originalTitle, meta.original_id), target: formatEntity(title, cardId) }).trim();
      case 'complete_card':
        return t('activity.complete_card', { actor }).trim();
      case 'uncomplete_card':
        return t('activity.uncomplete_card', { actor }).trim();

      case 'toggle_checklist_item':
        if (meta.is_checked === false) {
          return t('activity.checklist.unchecked', { actor, item: formatEntity(itemText, meta.item_id), checklist: checklistContext, card: cardContext }).trim();
        }
        return t('activity.checklist.checked', { actor, item: formatEntity(itemText, meta.item_id), checklist: checklistContext, card: cardContext }).trim();
      case 'add_checklist_item':
        return t('activity.add_checklist_item', { actor, item: formatEntity(itemText, meta.item_id), checklist: checklistContext, card: cardContext }).trim();
      case 'update_checklist_item':
        return t('activity.update_checklist_item', { actor, item: formatEntity(itemText, meta.item_id), checklist: checklistContext, card: cardContext }).trim();
      case 'add_comment':
        return t('activity.add_comment', { actor, comment: formatEntity(commentText, meta.comment_id), card: cardContext }).trim();
      case 'update_card_labels': {
        const added = addedLabels && addedLabels.length ? t('activity.labels.added', { labels: addedLabels.join(', ') }) : '';
        const removed = removedLabels && removedLabels.length ? t('activity.labels.removed', { labels: removedLabels.join(', ') }) : '';
        const changes = [added, removed].filter(Boolean).join('; ');
        return t('activity.update_card_labels', { actor, changes: changes || t('activity.labels.updated'), card: formatEntity(title, cardId) }).trim();
      }
      case 'create_label':
        return t('activity.create_label', { actor, label: formatEntity(labelName, meta.label_id), context: boardContext }).trim();
      case 'update_label':
        return t('activity.update_label', { actor, label: formatEntity(labelName, meta.label_id), context: boardContext }).trim();
      case 'delete_label':
        return t('activity.delete_label', { actor, label: formatEntity(labelName, meta.label_id), context: boardContext }).trim();

      case 'update_profile':
        return t('activity.update_profile', { actor }).trim();
      case 'update_avatar':
        return t('activity.update_avatar', { actor }).trim();
      case 'remove_avatar':
        return t('activity.remove_avatar', { actor }).trim();

      default: {
        const target = title || itemText || (log.entity_id ? `#${log.entity_id}` : '');
        return t('activity.default', { actor, target }).trim();
      }
    }
  };

  const containerVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0, transition: { duration: 0 } },
        exit: { opacity: 1, y: 0, transition: { duration: 0 } }
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
      };

  const privacyContent = React.useMemo(() => getProfilePrivacyContent(locale), [locale]);

  if (!user) return <div className="loading-state">{t('common.loading')}</div>;
  const showCurrentPasswordField = user.profile?.password_initialized !== false;

  const headerTitle = activeTab === 'privacy'
    ? t('profile.privacy.title')
    : activeTab === 'activity'
    ? t('profile.sections.activity')
    : activeTab === 'settings'
    ? t('profile.sections.settings')
    : t('profile.header.title');

  const headerSubtitle = activeTab === 'privacy'
    ? t('profile.privacy.subtitle')
    : activeTab === 'profile'
    ? t('profile.header.subtitle')
    : activeTab === 'activity'
    ? t('profile.activity.subtitle')
    : activeTab === 'settings'
    ? t('profile.settings.subtitle')
    : '';

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <aside className="profile-side">
          <Link to="/boards" className="profile-side-brand">Boardly</Link>

          <nav className="profile-nav">
            {(Object.keys(TAB_LABEL_KEYS) as TabKey[]).map((key) => {
              const Icon = TAB_ICONS[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`profile-nav-item ${activeTab === key ? 'active' : ''}`}
                >
                  <span className="profile-nav-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  {t(TAB_LABEL_KEYS[key])}
                </button>
              );
            })}
          </nav>

          <div className="profile-side-footer">
            <Link to="/boards" className="profile-return-link">
              {t('profile.backToMain')}
            </Link>
            <button type="button" className="profile-logout-btn" onClick={logout}>
              {t('nav.logout')}
            </button>
          </div>
        </aside>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
        />

        <main className="profile-main">
          <div className="profile-header">
            <div className="profile-header-controls">
              <Link to="/boards" className="profile-top-back">
                <BackIcon />
                <span>{t('community.back')}</span>
              </Link>
              <button
                type="button"
                className="profile-mobile-menu-trigger"
                aria-label={t('profile.tabsLabel')}
                aria-expanded={isMobileSettingsMenuOpen}
                onClick={() => setIsMobileSettingsMenuOpen(true)}
              >
                ⋯
              </button>
            </div>
            <h1>{headerTitle}</h1>
            {headerSubtitle && <p>{headerSubtitle}</p>}
          </div>

          {isMobileSettingsMenuOpen && (
            <div
              className="profile-mobile-menu-overlay"
              onClick={() => setIsMobileSettingsMenuOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label={t('profile.tabsLabel')}
            >
              <aside className="profile-mobile-menu" onClick={(e) => e.stopPropagation()}>
                <div className="profile-mobile-menu-top">
                  <span>{t('profile.tabsLabel')}</span>
                  <button
                    type="button"
                    className="profile-mobile-menu-close"
                    aria-label={t('common.close')}
                    onClick={() => setIsMobileSettingsMenuOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <nav className="profile-nav">
                  {(Object.keys(TAB_LABEL_KEYS) as TabKey[]).map((key) => {
                    const Icon = TAB_ICONS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setActiveTab(key);
                          navigate(`/profile?tab=${key}`);
                        }}
                        className={`profile-nav-item ${activeTab === key ? 'active' : ''}`}
                      >
                        <span className="profile-nav-icon" aria-hidden="true">
                          <Icon />
                        </span>
                        {t(TAB_LABEL_KEYS[key])}
                      </button>
                    );
                  })}
                </nav>

                <div className="profile-side-footer">
                  <Link to="/boards" className="profile-return-link" onClick={() => setIsMobileSettingsMenuOpen(false)}>
                    {t('profile.backToMain')}
                  </Link>
                  <button type="button" className="profile-logout-btn" onClick={logout}>
                    {t('nav.logout')}
                  </button>
                </div>
              </aside>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="profile-grid"
              >
                <section className="profile-card personal-info">
                  <div className="profile-card-title">{t('profile.section.personalInfo')}</div>
                  <div className="profile-personal-grid">
                    <div className="profile-avatar-col">
                      <div className="profile-avatar-large">
                        {resolvedAvatarUrlWithBuster && !avatarFailed ? (
                          <img src={resolvedAvatarUrlWithBuster} alt={t('profile.avatarAlt')} loading="lazy" decoding="async" onError={() => setAvatarFailed(true)} />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <button className="profile-btn-secondary avatar-btn" onClick={() => fileInputRef.current?.click()}>
                        {t('profile.avatar.change')}
                      </button>
                    </div>

                    <div className="profile-fields-col">
                      <div className="profile-name-row">
                        <div className="form-group inline-field">
                          <label>{t('profile.fields.firstName')}</label>
                        <input 
                            className="form-input input-first"
                            value={form.first_name}
                            onChange={e => setForm({...form, first_name: e.target.value})}
                            autoComplete="given-name"
                            name="first_name"
                          />
                        </div>
                        <div className="form-group inline-field">
                          <label>{t('profile.fields.lastName')}</label>
                        <input 
                            className="form-input input-last"
                            value={form.last_name}
                            onChange={e => setForm({...form, last_name: e.target.value})}
                            autoComplete="family-name"
                            name="last_name"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t('profile.fields.nickname')}</label>
                        <input 
                          className="form-input input-wide" 
                          value={form.username}
                          onChange={e => setForm({...form, username: e.target.value})}
                          autoComplete="username"
                          name="username"
                        />
                      </div>
                      <div className="form-group">
                        <label>{t('profile.fields.email')}</label>
                        <input 
                          className="form-input input-wide" 
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          autoComplete="email"
                          name="email"
                        />
                      </div>
                      <div className="profile-card-actions">
                        <button className="profile-btn-primary save-btn" onClick={handleSave} disabled={saving}>
                          {saving ? t('common.saving') : t('common.save')}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="profile-card password-change">
                  <div className="profile-card-title">{t('profile.section.passwordChange')}</div>
                  <div className="profile-form-grid one-col">
                    {showCurrentPasswordField && (
                      <div className="form-group">
                        <label>{t('profile.fields.currentPassword')}</label>
                        <input 
                          className="form-input" 
                          type="password" 
                          value={passwordForm.current_password}
                          onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
                          autoComplete="current-password"
                          name="current-password"
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label>{t('resetConfirm.newPasswordLabel')}</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          className="form-input" 
                          type={showNewPassword ? 'text' : 'password'} 
                          value={passwordForm.new_password}
                          onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                          autoComplete="new-password"
                          name="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{t('resetConfirm.confirmPasswordLabel')}</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          className="form-input" 
                          type={showNewPassword ? 'text' : 'password'} 
                          value={passwordForm.confirm_password}
                          onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                          autoComplete="new-password"
                          name="confirm-new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="profile-card-actions">
                    <button className="profile-btn-verify" onClick={handlePasswordChange}>
                      {t('profile.actions.changePassword')}
                    </button>
                  </div>
                </section>

                <section className="profile-card work-info">
                  <div className="work-info-header">
                    <div className="profile-card-title">{t('profile.section.workInfo')}</div>
                    <div className="work-public-row">
                      <span className="work-public-label">{t('profile.fields.public')}</span>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox"
                          checked={form.notify_email}
                          onChange={e => setForm({...form, notify_email: e.target.checked})}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  <div className="profile-form-grid one-col">
                    <div className="form-group">
                      <label>{t('profile.fields.organization')}</label>
                      <input 
                        className="form-input work-input"
                        value={form.organization}
                        onChange={e => setForm({...form, organization: e.target.value})}
                        placeholder={t('profile.placeholders.organization')}
                        autoComplete="organization"
                        name="organization"
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('profile.fields.bio')}</label>
                      <textarea
                        className="form-input work-bio"
                        value={form.bio}
                        onChange={e => setForm({...form, bio: e.target.value})}
                        placeholder={t('profile.placeholders.bio')}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="sentences"
                        inputMode="text"
                        spellCheck
                        name="bio"
                      />
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div 
                key="activity"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="profile-activity-shell"
              >
                <div className="profile-card-actions" style={{ marginBottom: 12 }}>
                  <button
                    className="profile-btn-secondary"
                    type="button"
                    onClick={handleClearActivity}
                    disabled={loadingActivity || activityLogs.length === 0}
                  >
                    Clear activity
                  </button>
                </div>
                <div className="activity-list">
                  {loadingActivity ? (
                    <div className="activity-empty-row">{t('common.loading')}</div>
                  ) : activityLogs.length === 0 ? (
                    <div className="activity-empty-row">{t('profile.activity.empty')}</div>
                  ) : (
                    activityLogs.map(log => (
                      <div key={log.id} className="activity-item">
                        <div className="activity-icon">📝</div>
                        <div className="activity-details">
                          <span className="activity-text">{getActivityMessage(log)}</span>
                          <span className="activity-date">
                            {new Date(log.created_at).toLocaleString(locale)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="settings-layout"
              >
                <section className="settings-card settings-card-general">
                  <div className="settings-card-title">{t('profile.settings.general')}</div>
                  <div className="settings-field settings-field-language">
                    <label>{t('profile.settings.language')}</label>
                    <select
                      className="form-input settings-select"
                      value={form.language}
                      onChange={e => setForm({ ...form, language: e.target.value })}
                    >
                      {supportedLocales.map(code => (
                        <option key={code} value={code}>
                          {t(`lang.${code}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-field settings-field-language">
                    <label>Auto-delete activity</label>
                    <select
                      className="form-input settings-select"
                      value={form.activity_retention}
                      onChange={e => setForm({ ...form, activity_retention: e.target.value as '7d' | '30d' | '365d' })}
                    >
                      <option value="7d">7 days</option>
                      <option value="30d">1 month</option>
                      <option value="365d">1 year</option>
                    </select>
                  </div>

                  <div className="settings-card-title settings-subtitle">{t('profile.settings.notifications')}</div>
                  <div className="settings-row settings-toggle-row">
                    <span className="settings-row-label">{t('profile.settings.desktopNotifications')}</span>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settingsPrefs.desktopNotifications}
                        onChange={e => setSettingsPrefs(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-row settings-toggle-row">
                    <span className="settings-row-label settings-row-label-sub">{t('profile.settings.assignedToTask')}</span>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settingsPrefs.assignedToTask}
                        onChange={e => setSettingsPrefs(prev => ({ ...prev, assignedToTask: e.target.checked }))}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-row settings-toggle-row">
                    <span className="settings-row-label settings-row-label-sub">{t('profile.settings.dueDateApproaching')}</span>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settingsPrefs.dueDateApproaching}
                        onChange={e => setSettingsPrefs(prev => ({ ...prev, dueDateApproaching: e.target.checked }))}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-row settings-toggle-row">
                    <span className="settings-row-label settings-row-label-sub">{t('profile.settings.addedToBoard')}</span>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settingsPrefs.addedToBoard}
                        onChange={e => setSettingsPrefs(prev => ({ ...prev, addedToBoard: e.target.checked }))}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-general-actions">
                    <button className="settings-btn settings-btn-accent" type="button" onClick={handleClearCache}>
                      {t('profile.settings.clearCache')}
                    </button>
                    <button className="settings-btn settings-btn-primary" type="button" onClick={handleSave} disabled={saving}>
                      {saving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div 
                key="privacy"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="profile-privacy-layout"
              >
                {privacyContent.paragraphs.map((paragraph, index) => (
                  <p
                    key={`privacy-paragraph-${index}`}
                    className={`privacy-text-block${index === privacyContent.paragraphs.length - 1 ? ' short' : ''}`}
                  >
                    {paragraph}
                  </p>
                ))}
                {privacyContent.translationNotice && (
                  <p className="privacy-summary-line">{privacyContent.translationNotice}</p>
                )}
                <p className="privacy-summary-line">{privacyContent.summaryTitle}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      {isEmailPrefsOpen && (
        <div className="settings-modal-overlay" onClick={closeEmailPrefs}>
          <div
            ref={emailPrefsDialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-prefs-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="settings-modal-close" onClick={closeEmailPrefs} aria-label={t('common.close')}>
              {t('profile.deactivate.close')}
            </button>
            <div className="settings-modal-title" id="email-prefs-modal-title">{t('profile.emailPrefs.title')}</div>
            <div className="settings-modal-subtitle">{t('profile.emailPrefs.subtitle')}</div>
            <div className="settings-modal-content">
              <div className="settings-toggle-row">
                <span>{t('profile.emailPrefs.enableEmail')}</span>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={form.notify_email}
                    onChange={e => setForm({ ...form, notify_email: e.target.checked })}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
              <div className="settings-toggle-row">
                <span>{t('profile.emailPrefs.assignedToTask')}</span>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settingsPrefs.assignedToTask}
                    onChange={e => setSettingsPrefs(prev => ({ ...prev, assignedToTask: e.target.checked }))}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
              <div className="settings-toggle-row">
                <span>{t('profile.emailPrefs.dueDateApproaching')}</span>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settingsPrefs.dueDateApproaching}
                    onChange={e => setSettingsPrefs(prev => ({ ...prev, dueDateApproaching: e.target.checked }))}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
              <div className="settings-toggle-row">
                <span>{t('profile.emailPrefs.addedToBoard')}</span>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settingsPrefs.addedToBoard}
                    onChange={e => setSettingsPrefs(prev => ({ ...prev, addedToBoard: e.target.checked }))}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            </div>
            <div className="settings-modal-actions">
              <button
                className="settings-btn settings-btn-primary"
                type="button"
                onClick={async () => {
                  await handleSave();
                  closeEmailPrefs();
                }}
                disabled={saving}
              >
                {saving ? t('common.saving') : t('profile.settings.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isIntegrationsOpen && (
        <div className="settings-modal-overlay" onClick={closeIntegrations}>
          <div
            ref={integrationsDialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="integrations-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="settings-modal-close" onClick={closeIntegrations} aria-label={t('common.close')}>
              {t('profile.deactivate.close')}
            </button>
            <div className="settings-modal-title" id="integrations-modal-title">{t('profile.integrations.title')}</div>
            <div className="settings-modal-subtitle">{t('profile.integrations.subtitle')}</div>
            <div className="settings-modal-content integrations-list">
              <div className="integration-item">
                <div>
                  <div className="integration-name">Slack</div>
                  <div className="integration-desc">{t('profile.integrations.slack')}</div>
                </div>
                <button className="settings-btn settings-btn-secondary" type="button" onClick={handleComingSoon}>
                  {t('profile.integrations.connect')}
                </button>
              </div>
              <div className="integration-item">
                <div>
                  <div className="integration-name">Google Calendar</div>
                  <div className="integration-desc">{t('profile.integrations.calendar')}</div>
                </div>
                <button className="settings-btn settings-btn-secondary" type="button" onClick={handleComingSoon}>
                  {t('profile.integrations.connect')}
                </button>
              </div>
              <div className="integration-item">
                <div>
                  <div className="integration-name">GitHub</div>
                  <div className="integration-desc">{t('profile.integrations.github')}</div>
                </div>
                <button className="settings-btn settings-btn-secondary" type="button" onClick={handleComingSoon}>
                  {t('profile.integrations.connect')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPasswordInstructionsOpen && (
        <div className="settings-modal-overlay" onClick={closePasswordInstructions}>
          <div
            ref={passwordInstructionsDialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-instructions-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="settings-modal-close"
              onClick={closePasswordInstructions}
              aria-label={t('common.close')}
            >
              {t('profile.deactivate.close')}
            </button>
            <div className="settings-modal-title" id="password-instructions-modal-title">
              Підтвердіть зміну пароля
            </div>
            <div className="settings-modal-subtitle">
              Ми надіслали лист на вашу пошту. Відкрийте лист і перейдіть за посиланням, щоб завершити зміну пароля.
            </div>
            <div className="settings-modal-content">
              <div className="settings-helper">
                Якщо лист не з&apos;явився, перевірте папки «Спам» та «Промоакції».
              </div>
            </div>
            <div className="settings-modal-actions">
              <button
                className="settings-btn settings-btn-primary"
                type="button"
                onClick={closePasswordInstructions}
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="profile-toast">{toast}</div>}
      {isDeactivateOpen && (
        <div className="attention-overlay" onClick={closeDeactivate}>
          <div
            ref={deactivateDialogRef}
            className="attention-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="attention-close" onClick={closeDeactivate} aria-label={t('common.close')}>
              {t('profile.deactivate.close')}
            </button>
            <div className="attention-title" id="deactivate-modal-title">{t('profile.deactivate.title')}</div>
            <div className="attention-text">{t('profile.deactivate.message')}</div>
            <button
              className="attention-action"
              type="button"
              onClick={async () => {
                closeDeactivate();
                await handleDeleteAccount();
              }}
            >
              {t('profile.deactivate.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
