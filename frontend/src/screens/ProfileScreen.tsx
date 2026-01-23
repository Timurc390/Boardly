import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ActivityLog } from '../types';
import { useI18n } from '../context/I18nContext';
import { type Locale } from '../i18n/translations';

const API_URL = process.env.REACT_APP_API_URL || '/api';

type TabKey = 'profile' | 'activity' | 'settings';

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  profile: 'profile.tabs.profile',
  activity: 'profile.tabs.activity',
  settings: 'profile.tabs.settings',
};

const ACTION_LABEL_KEYS: Record<string, string> = {
  create_board: 'activity.createBoard',
  rename_board: 'activity.renameBoard',
  update_board: 'activity.updateBoard',
  archive_board: 'activity.archiveBoard',
  unarchive_board: 'activity.unarchiveBoard',
  create_list: 'activity.createList',
  rename_list: 'activity.renameList',
  move_list: 'activity.moveList',
  archive_list: 'activity.archiveList',
  unarchive_list: 'activity.unarchiveList',
  create_card: 'activity.createCard',
  move_card: 'activity.moveCard',
  archive_card: 'activity.archiveCard',
  unarchive_card: 'activity.unarchiveCard',
  update_card: 'activity.updateCard',
  update_card_description: 'activity.updateCardDescription',
  update_card_due_date: 'activity.updateCardDueDate',
  toggle_checklist_item: 'activity.toggleChecklistItem',
  update_profile: 'activity.updateProfile',
  update_avatar: 'activity.updateAvatar',
  remove_avatar: 'activity.removeAvatar',
};

export const ProfileScreen: React.FC = () => {
  const { user, isAuthenticated, authToken, logout, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    theme: 'dark' as 'light' | 'dark',
    language: 'uk' as Locale,
    notify_email: true,
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const themeSyncRef = useRef(false);
  const themeSaveTimerRef = useRef<number | null>(null);
  const themePendingRef = useRef<'light' | 'dark' | null>(null);

  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityOffset, setActivityOffset] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(true);
  const [activityLoaded, setActivityLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      const resolvedTheme = (user.profile?.theme as 'light' | 'dark') || 'dark';
      if (themePendingRef.current && resolvedTheme === themePendingRef.current) {
        themePendingRef.current = null;
      }
      setForm((prev) => ({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        organization: user.profile?.organization || '',
        theme: themePendingRef.current ? prev.theme : resolvedTheme,
        language: (user.profile?.language as Locale) || 'uk',
        notify_email: user.profile?.notify_email ?? true,
      }));
      setLoadingProfile(false);
    } else if (!isAuthenticated) {
      setLoadingProfile(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = form.theme;
    localStorage.setItem('profileTheme', form.theme);

    if (!user) return;
    if (!themeSyncRef.current) {
      themeSyncRef.current = true;
      return;
    }
    if (themeSaveTimerRef.current) {
      window.clearTimeout(themeSaveTimerRef.current);
    }
    themePendingRef.current = form.theme;
    themeSaveTimerRef.current = window.setTimeout(() => {
      void updateProfile({ profile: { theme: form.theme } });
    }, 300);
  }, [form.theme, user, updateProfile]);

  useEffect(() => {
    if (activeTab === 'activity' && authToken && !activityLoaded) {
      void loadActivity(0, false);
    }
  }, [activeTab, activityLoaded, authToken]);

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  const avatarUrl = avatarPreview || user?.profile?.avatar_url || user?.profile?.avatar || '';
  const initials = (user?.first_name || user?.last_name || user?.username || 'U')[0]?.toUpperCase() || 'U';
  const displayName = useMemo(() => {
    if (!user) return '';
    const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return full || user.username;
  }, [user]);
  const dateLocale = useMemo(() => {
    switch (locale) {
      case 'uk':
        return 'uk-UA';
      case 'pl':
        return 'pl-PL';
      case 'de':
        return 'de-DE';
      case 'fr':
        return 'fr-FR';
      case 'es':
        return 'es-ES';
      default:
        return 'en-US';
    }
  }, [locale]);

  const formatRelative = (iso: string) => {
    const timestamp = new Date(iso).getTime();
    if (Number.isNaN(timestamp)) return '';
    const diff = Math.max(Date.now() - timestamp, 0);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('profile.time.justNow');
    if (minutes < 60) return t('profile.time.minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('profile.time.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('profile.time.daysAgo', { count: days });
    return new Date(iso).toLocaleDateString(dateLocale);
  };

  const getActivityTitle = (entry: ActivityLog) => {
    const labelKey = ACTION_LABEL_KEYS[entry.action] || 'activity.event';
    const label = t(labelKey);
    const title = entry.meta?.title ? ` "${entry.meta.title}"` : '';
    return `${label}${title}`;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setProfileError(t('profile.errors.requiredName'));
      return;
    }
    setProfileError(null);
    setSaving(true);
    try {
      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        profile: {
          organization: form.organization.trim(),
          theme: form.theme,
          language: form.language,
          notify_email: form.notify_email,
        },
      });
      setToast(t('profile.toast.saved'));
    } catch (err) {
      console.error(err);
      setProfileError(t('profile.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError(t('profile.errors.imageOnly'));
      return;
    }
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      setToast(t('profile.toast.avatarUpdated'));
    } catch (err) {
      console.error(err);
      setProfileError(t('profile.errors.avatarUploadFailed'));
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await removeAvatar();
      setAvatarPreview(null);
      setToast(t('profile.toast.avatarRemoved'));
    } catch (err) {
      console.error(err);
      setProfileError(t('profile.errors.avatarRemoveFailed'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const loadActivity = async (offset = 0, append = false) => {
    if (!authToken) return;
    setActivityLoading(true);
    setActivityError(null);
    try {
      const res = await axios.get(`${API_URL}/activity/`, {
        params: { limit: 10, offset },
        headers: { Authorization: `Token ${authToken}` },
      });
      const payload = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setActivity((prev) => (append ? [...prev, ...payload] : payload));
      setActivityOffset(offset + payload.length);
      setActivityHasMore(Boolean(res.data?.next));
      setActivityLoaded(true);
    } catch (err) {
      console.error(err);
      setActivityError(t('profile.errors.activityLoad'));
    } finally {
      setActivityLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="profile-shell">
          <div className="profile-card">
            <div className="profile-avatar skeleton" />
            <div className="skeleton" style={{ height: 16, width: '70%' }} />
            <div className="skeleton" style={{ height: 12, width: '90%' }} />
            <div className="skeleton" style={{ height: 12, width: '80%' }} />
            <div className="profile-actions">
              <div className="skeleton" style={{ height: 36, width: 120 }} />
              <div className="skeleton" style={{ height: 36, width: 120 }} />
            </div>
          </div>
          <div className="profile-content">
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="profile-panel">
              <div className="skeleton" style={{ height: 14, width: '30%' }} />
              <div className="profile-grid">
                <div className="skeleton" style={{ height: 44 }} />
                <div className="skeleton" style={{ height: 44 }} />
                <div className="skeleton" style={{ height: 44 }} />
                <div className="skeleton" style={{ height: 44 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="profile-page">
        <div className="profile-shell">
          <div className="profile-panel">
            <h3>{t('profile.authRequiredTitle')}</h3>
            <p className="profile-hint">{t('profile.authRequiredHint')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <motion.aside
          className="profile-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div className="profile-avatar" whileHover={{ scale: 1.03 }}>
            {avatarUrl ? <img src={avatarUrl} alt={t('profile.avatarAlt')} /> : initials}
          </motion.div>
          <div>
            <div className="profile-name">{displayName}</div>
            <div className="profile-meta">
              <span>@{user.username}</span>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="profile-actions">
            <button
              className="btn-secondary focus-ring"
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              aria-label={t('profile.avatar.change')}
            >
              {avatarUploading ? t('common.loading') : t('profile.avatar.change')}
            </button>
            {(user.profile?.avatar_url || user.profile?.avatar || avatarPreview) && (
              <button
                className="btn-danger focus-ring"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                aria-label={t('profile.avatar.remove')}
              >
                {t('profile.avatar.remove')}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <button className="btn-ghost focus-ring" onClick={logout}>{t('nav.logout')}</button>
        </motion.aside>

        <section className="profile-content">
          <div className="profile-tabs" role="tablist" aria-label={t('profile.tabsLabel')}>
            {(Object.keys(TAB_LABEL_KEYS) as TabKey[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                id={`tab-${tab}`}
                aria-controls={`panel-${tab}`}
                aria-selected={activeTab === tab}
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {t(TAB_LABEL_KEYS[tab])}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                className="profile-panel"
                role="tabpanel"
                id="panel-profile"
                aria-labelledby="tab-profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h3>{t('profile.sections.profile')}</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-first-name">{t('profile.fields.firstName')}</label>
                    <input
                      id="profile-first-name"
                      className="input focus-ring"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      aria-label={t('profile.fields.firstName')}
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-last-name">{t('profile.fields.lastName')}</label>
                    <input
                      id="profile-last-name"
                      className="input focus-ring"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      aria-label={t('profile.fields.lastName')}
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-org">{t('profile.fields.organization')}</label>
                    <input
                      id="profile-org"
                      className="input focus-ring"
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      aria-label={t('profile.fields.organization')}
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-username">{t('profile.fields.nickname')}</label>
                    <input id="profile-username" className="input" value={user.username} readOnly aria-label={t('profile.fields.nickname')} />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-email">Email</label>
                    <input id="profile-email" className="input" value={user.email} readOnly aria-label="Email" />
                  </div>
                </div>
                {profileError && <div className="profile-hint">{profileError}</div>}
                <div className="profile-actions-row">
                  <button className="btn-secondary focus-ring" onClick={handleSave} disabled={saving}>
                    {saving ? t('profile.saving') : t('common.save')}
                  </button>
                  <button
                    className="btn-ghost focus-ring"
                    onClick={() => setForm({
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                      organization: user.profile?.organization || '',
                      theme: (user.profile?.theme as 'light' | 'dark') || 'dark',
                      language: (user.profile?.language as Locale) || 'uk',
                      notify_email: user.profile?.notify_email ?? true,
                    })}
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                className="profile-panel"
                role="tabpanel"
                id="panel-activity"
                aria-labelledby="tab-activity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h3>{t('profile.sections.activity')}</h3>
                <div className="activity-list">
                  {activityLoading && activity.length === 0 && (
                    <>
                      <div className="skeleton" style={{ height: 64 }} />
                      <div className="skeleton" style={{ height: 64 }} />
                      <div className="skeleton" style={{ height: 64 }} />
                    </>
                  )}
                  {!activityLoading && activity.length === 0 && !activityError && (
                    <div className="profile-hint">{t('profile.activity.empty')}</div>
                  )}
                  {activityError && <div className="profile-hint">{activityError}</div>}
                  {activity.map((entry) => (
                    <div key={entry.id} className="activity-item">
                      <div className="activity-icon">{entry.entity_type?.[0]?.toUpperCase() || '•'}</div>
                      <div>
                        <div className="activity-title">{getActivityTitle(entry)}</div>
                        <div className="activity-meta">
                          {entry.entity_type && t('profile.activity.type', { type: entry.entity_type })}{' '}
                          {entry.entity_id ? `#${entry.entity_id}` : ''}
                        </div>
                      </div>
                      <div className="activity-meta">{formatRelative(entry.created_at)}</div>
                    </div>
                  ))}
                </div>
                {activityHasMore && (
                  <div className="profile-actions-row">
                    <button
                      className="btn-ghost focus-ring"
                      onClick={() => loadActivity(activityOffset, true)}
                      disabled={activityLoading}
                    >
                      {activityLoading ? t('common.loading') : t('profile.activity.loadMore')}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                className="profile-panel"
                role="tabpanel"
                id="panel-settings"
                aria-labelledby="tab-settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h3>{t('profile.sections.settings')}</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <label className="profile-label">{t('profile.fields.theme')}</label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.theme === 'dark'}
                        onChange={(e) => setForm({ ...form, theme: e.target.checked ? 'dark' : 'light' })}
                        aria-label={t('profile.fields.themeToggle')}
                      />
                      <span className="toggle-track" />
                      <span>{form.theme === 'dark' ? t('profile.theme.dark') : t('profile.theme.light')}</span>
                    </label>
                  </div>
                  <div className="profile-field">
                    <label className="profile-label">{t('profile.fields.language')}</label>
                    <select
                      className="input focus-ring"
                      value={form.language}
                      onChange={(e) => {
                        const next = e.target.value as Locale;
                        setForm({ ...form, language: next });
                        setLocale(next);
                      }}
                    >
                      {supportedLocales.map(code => (
                        <option key={code} value={code}>{t(`lang.${code}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="profile-field">
                    <label className="profile-label">{t('profile.fields.emailNotifications')}</label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.notify_email}
                        onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
                        aria-label={t('profile.fields.emailNotifications')}
                      />
                      <span className="toggle-track" />
                      <span>{form.notify_email ? t('profile.notifications.on') : t('profile.notifications.off')}</span>
                    </label>
                  </div>
                </div>
                {profileError && <div className="profile-hint">{profileError}</div>}
                <div className="profile-actions-row">
                  <button className="btn-secondary focus-ring" onClick={handleSave} disabled={saving}>
                    {saving ? t('profile.saving') : t('profile.saveSettings')}
                  </button>
                  <button className="btn-danger focus-ring" disabled title={t('profile.logoutAllHint')}>
                    {t('profile.logoutAll')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
