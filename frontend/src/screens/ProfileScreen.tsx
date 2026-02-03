import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { FiUser, FiShield, FiSettings, FiClock, FiArrowLeft } from 'react-icons/fi';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { ActivityLog } from '../types';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { useI18n } from '../context/I18nContext';
import { type Locale } from '../i18n/translations';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  updateUserProfile, 
  uploadUserAvatar, 
  removeUserAvatar, 
  logoutUser, 
  changeUserPassword,
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

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const logout = () => {
    dispatch(logoutUser());
  };

  const updateProfile = async (data: Partial<any>) => {
    return dispatch(updateUserProfile(data));
  };

  const uploadAvatar = async (file: File) => {
    return dispatch(uploadUserAvatar(file));
  };

  const deleteAvatar = async () => {
    return dispatch(removeUserAvatar());
  };
  const { user, token } = useAppSelector(state => state.auth);
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [settingsPrefs, setSettingsPrefs] = useState({
    desktopNotifications: true,
    assignedToTask: true,
    dueDateApproaching: true,
    addedToBoard: true,
    twoFactor: false,
    requireVerification: false,
    defaultBoardView: 'kanban' as 'kanban' | 'calendar',
    sessionTimeout: '1h'
  });
  const [isEmailPrefsOpen, setIsEmailPrefsOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

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
        theme: (user.profile?.theme as string) || 'dark',
        language: user.profile?.language || 'uk',
        notify_email: user.profile?.notify_email ?? true,
      });
      setSettingsPrefs(prev => ({
        ...prev,
        desktopNotifications: user.profile?.notify_desktop ?? prev.desktopNotifications,
        assignedToTask: user.profile?.notify_assigned ?? prev.assignedToTask,
        dueDateApproaching: user.profile?.notify_due ?? prev.dueDateApproaching,
        addedToBoard: user.profile?.notify_added ?? prev.addedToBoard,
        twoFactor: user.profile?.two_factor_enabled ?? prev.twoFactor,
        requireVerification: user.profile?.require_login_verification ?? prev.requireVerification,
        defaultBoardView: (user.profile?.default_board_view as 'kanban' | 'calendar') || prev.defaultBoardView,
        sessionTimeout: user.profile?.session_timeout || prev.sessionTimeout
      }));
    }
  }, [user]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = form.theme;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', form.theme);
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
          theme: form.theme as 'light' | 'dark',
          language: form.language as Locale, // ВИПРАВЛЕНО: Явне приведення типу для TypeScript
          notify_email: form.notify_email,
          notify_desktop: settingsPrefs.desktopNotifications,
          notify_assigned: settingsPrefs.assignedToTask,
          notify_due: settingsPrefs.dueDateApproaching,
          notify_added: settingsPrefs.addedToBoard,
          default_board_view: settingsPrefs.defaultBoardView,
          session_timeout: settingsPrefs.sessionTimeout,
          two_factor_enabled: settingsPrefs.twoFactor,
          require_login_verification: settingsPrefs.requireVerification,
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
        showToast(t('profile.toast.avatarUpdated'));
      } catch {
        showToast(t('common.error'));
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      showToast(t('common.error'));
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast(t('resetConfirm.errorMismatch'));
      return;
    }
    try {
      await dispatch(changeUserPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      })).unwrap();
      showToast(t('resetConfirm.successTitle'));
      await dispatch(logoutUser());
      navigate('/');
    } catch (e) {
      console.error(e);
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
  }, [rawAvatarUrl, rawAvatarPath]);
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (!user) return <div className="loading-state">{t('common.loading')}</div>;

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
    : activeTab === 'settings'
    ? t('profile.settings.subtitle')
    : '';

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <aside className="profile-side">
          <div className="profile-side-brand">Boardly</div>
          <div className="profile-user-card">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {resolvedAvatarUrl && !avatarFailed ? (
                  <img src={resolvedAvatarUrl} alt="Avatar" onError={() => setAvatarFailed(true)} />
                ) : (
                  <span className="profile-initials">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="avatar-overlay" onClick={() => fileInputRef.current?.click()}>
                  <span>📷</span>
                </div>
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*"
                />
              </div>
            </div>
            <h2 className="profile-name">{user.first_name} {user.last_name}</h2>
            <p className="profile-username">{user.email}</p>
          </div>

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
            <Link to="/boards" className="profile-nav-item profile-back-link">
              <span className="profile-nav-icon" aria-hidden="true">
                <BackIcon />
              </span>
              {t('profile.backToMain')}
            </Link>
          </nav>

          <Link to="/help" className="profile-help-button" aria-label={t('nav.help')}>
            ?
          </Link>
        </aside>

        <main className="profile-main">
          <div className="profile-header">
            <h1>{headerTitle}</h1>
            {headerSubtitle && <p>{headerSubtitle}</p>}
          </div>

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
                        {resolvedAvatarUrl && !avatarFailed ? (
                          <img src={resolvedAvatarUrl} alt={t('profile.avatarAlt')} onError={() => setAvatarFailed(true)} />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <button className="profile-btn-secondary avatar-btn" onClick={() => fileInputRef.current?.click()}>
                        {t('profile.avatar.change')}
                      </button>
                      <button className="profile-btn-danger avatar-btn" onClick={deleteAvatar}>
                        {t('profile.avatar.remove')}
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

                <section className="profile-card access">
                  <div className="profile-card-title">{t('profile.section.access')}</div>
                  <div className="profile-card-actions column">
                    <button className="profile-btn-secondary" onClick={logout}>{t('nav.logout')}</button>
                    <button className="profile-btn-danger" onClick={() => setIsDeactivateOpen(true)}>
                      {t('profile.actions.deactivate')}
                    </button>
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
                className="profile-card"
              >
                <div className="profile-card-title">{t('profile.tabs.activity')}</div>
                <div className="activity-list">
                  {loadingActivity ? (
                    <div className="loading-state">{t('common.loading')}</div>
                  ) : activityLogs.length === 0 ? (
                    <div className="empty-state">{t('profile.activity.empty')}</div>
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
                <div className="settings-grid-top">
                  <section className="settings-card settings-card-general">
                    <div className="settings-card-title">{t('profile.settings.general')}</div>
                    <div className="settings-field">
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
                    <button className="settings-btn settings-btn-muted" type="button" onClick={handleClearCache}>
                      {t('profile.settings.clearCache')}
                    </button>
                    <div className="settings-helper">{t('profile.settings.cacheDescription')}</div>
                  </section>

                  <section className="settings-card settings-card-notifications">
                    <div className="settings-card-title">{t('profile.settings.notifications')}</div>
                    <div className="settings-toggle-row">
                      <span>{t('profile.settings.desktopNotifications')}</span>
                      <label className="settings-toggle">
                        <input
                          type="checkbox"
                          checked={settingsPrefs.desktopNotifications}
                          onChange={e => setSettingsPrefs(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                        />
                        <span className="settings-toggle-slider" />
                      </label>
                    </div>
                    <div className="settings-toggle-row">
                      <span>{t('profile.settings.assignedToTask')}</span>
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
                      <span>{t('profile.settings.dueDateApproaching')}</span>
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
                      <span>{t('profile.settings.addedToBoard')}</span>
                      <label className="settings-toggle">
                        <input
                          type="checkbox"
                          checked={settingsPrefs.addedToBoard}
                          onChange={e => setSettingsPrefs(prev => ({ ...prev, addedToBoard: e.target.checked }))}
                        />
                        <span className="settings-toggle-slider" />
                      </label>
                    </div>
                    <button className="settings-btn settings-btn-accent" type="button" onClick={() => setIsEmailPrefsOpen(true)}>
                      {t('profile.settings.manageEmail')}
                    </button>
                  </section>

                  <section className="settings-card settings-card-appearance">
                    <div className="settings-card-title">{t('profile.settings.appearance')}</div>
                    <div className="settings-field">
                      <label>{t('profile.settings.theme')}</label>
                      <div className="settings-pill-row">
                        <button
                          className={`settings-pill ${form.theme === 'dark' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setForm({ ...form, theme: 'dark' })}
                        >
                          {t('profile.settings.dark')}
                        </button>
                        <button
                          className={`settings-pill ${form.theme === 'light' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setForm({ ...form, theme: 'light' })}
                        >
                          {t('profile.settings.light')}
                        </button>
                      </div>
                    </div>
                    <div className="settings-field">
                      <label>{t('profile.settings.defaultBoardView')}</label>
                      <div className="settings-pill-row">
                        <button
                          className={`settings-pill ${settingsPrefs.defaultBoardView === 'kanban' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setSettingsPrefs(prev => ({ ...prev, defaultBoardView: 'kanban' }))}
                        >
                          {t('profile.settings.kanban')}
                        </button>
                        <button
                          className={`settings-pill ${settingsPrefs.defaultBoardView === 'calendar' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setSettingsPrefs(prev => ({ ...prev, defaultBoardView: 'calendar' }))}
                        >
                          {t('profile.settings.calendar')}
                        </button>
                      </div>
                    </div>
                    <button className="settings-btn settings-btn-secondary" type="button" onClick={() => setIsIntegrationsOpen(true)}>
                      {t('profile.settings.manageIntegrations')}
                    </button>
                  </section>
                </div>

                <section className="settings-card settings-card-security">
                  <div className="settings-card-title">{t('profile.settings.security')}</div>
                  <div className="settings-toggle-row">
                    <span>{t('profile.settings.twoFactor')}</span>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settingsPrefs.twoFactor}
                        onChange={e => setSettingsPrefs(prev => ({ ...prev, twoFactor: e.target.checked }))}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-toggle-row">
                    <div>
                      <div>{t('profile.settings.requireVerification')}</div>
                      <div className="settings-helper">{t('profile.settings.additionalVerification')}</div>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settingsPrefs.requireVerification}
                        onChange={e => setSettingsPrefs(prev => ({ ...prev, requireVerification: e.target.checked }))}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                  <div className="settings-field settings-inline">
                    <label>{t('profile.settings.sessionTimeout')}</label>
                    <select
                      className="form-input settings-select"
                      value={settingsPrefs.sessionTimeout}
                      onChange={e => setSettingsPrefs(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                    >
                      <option value="1h">{t('profile.settings.sessionTimeout1h')}</option>
                    </select>
                  </div>
                  <div className="settings-actions">
                    <button className="settings-btn settings-btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? t('common.saving') : t('profile.settings.saveChanges')}
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
                className="profile-privacy-body"
              >
                <PrivacyPolicyScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      {isEmailPrefsOpen && (
        <div className="settings-modal-overlay" onClick={() => setIsEmailPrefsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="settings-modal-close" onClick={() => setIsEmailPrefsOpen(false)}>
              {t('profile.deactivate.close')}
            </button>
            <div className="settings-modal-title">{t('profile.emailPrefs.title')}</div>
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
                onClick={async () => {
                  await handleSave();
                  setIsEmailPrefsOpen(false);
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
        <div className="settings-modal-overlay" onClick={() => setIsIntegrationsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="settings-modal-close" onClick={() => setIsIntegrationsOpen(false)}>
              {t('profile.deactivate.close')}
            </button>
            <div className="settings-modal-title">{t('profile.integrations.title')}</div>
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

      {toast && <div className="profile-toast">{toast}</div>}
      {isDeactivateOpen && (
        <div className="attention-overlay" onClick={() => setIsDeactivateOpen(false)}>
          <div className="attention-modal" onClick={(e) => e.stopPropagation()}>
            <button className="attention-close" onClick={() => setIsDeactivateOpen(false)}>
              {t('profile.deactivate.close')}
            </button>
            <div className="attention-title">{t('profile.deactivate.title')}</div>
            <div className="attention-text">{t('profile.deactivate.message')}</div>
            <button
              className="attention-action"
              onClick={async () => {
                setIsDeactivateOpen(false);
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
