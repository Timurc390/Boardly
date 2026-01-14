import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ActivityLog } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

type TabKey = 'profile' | 'activity' | 'settings';

const TAB_LABELS: Record<TabKey, string> = {
  profile: 'Профіль і доступ',
  activity: 'Активність',
  settings: 'Налаштування',
};

const ACTION_LABELS: Record<string, string> = {
  create_board: 'Створено дошку',
  rename_board: 'Перейменовано дошку',
  update_board: 'Оновлено дошку',
  archive_board: 'Архівовано дошку',
  unarchive_board: 'Відновлено дошку',
  create_list: 'Створено список',
  rename_list: 'Перейменовано список',
  move_list: 'Переміщено список',
  archive_list: 'Архівовано список',
  unarchive_list: 'Відновлено список',
  create_card: 'Створено картку',
  move_card: 'Переміщено картку',
  archive_card: 'Архівовано картку',
  unarchive_card: 'Відновлено картку',
  update_card: 'Оновлено картку',
  update_card_description: 'Оновлено опис картки',
  update_card_due_date: 'Оновлено дедлайн',
  toggle_checklist_item: 'Змінено пункт чеклисту',
  update_profile: 'Оновлено профіль',
  update_avatar: 'Оновлено аватар',
  remove_avatar: 'Видалено аватар',
};

const formatRelative = (iso: string) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(Date.now() - t, 0);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'щойно';
  if (m < 60) return `${m} хв тому`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} год тому`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн тому`;
  return new Date(iso).toLocaleDateString('uk-UA');
};

const getActivityTitle = (entry: ActivityLog) => {
  const label = ACTION_LABELS[entry.action] || 'Подія';
  const title = entry.meta?.title ? ` "${entry.meta.title}"` : '';
  return `${label}${title}`;
};

export const ProfileScreen: React.FC = () => {
  const { user, isAuthenticated, authToken, logout, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    theme: 'dark' as 'light' | 'dark',
    language: 'uk' as 'uk' | 'en',
    notify_email: true,
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityOffset, setActivityOffset] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(true);
  const [activityLoaded, setActivityLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        organization: user.profile?.organization || '',
        theme: (user.profile?.theme as 'light' | 'dark') || 'dark',
        language: (user.profile?.language as 'uk' | 'en') || 'uk',
        notify_email: user.profile?.notify_email ?? true,
      });
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
  }, [form.theme]);

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

  const handleSave = async () => {
    if (!user) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setProfileError('Ім’я та прізвище обов’язкові');
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
      setToast('Збережено');
    } catch (err) {
      console.error(err);
      setProfileError('Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('Доступні лише зображення');
      return;
    }
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      setToast('Фото оновлено');
    } catch (err) {
      console.error(err);
      setProfileError('Не вдалося завантажити фото');
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
      setToast('Фото видалено');
    } catch (err) {
      console.error(err);
      setProfileError('Не вдалося видалити фото');
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
      setActivityError('Не вдалося завантажити активність');
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
            <h3>Потрібна авторизація</h3>
            <p className="profile-hint">Увійдіть у систему, щоб переглянути профіль.</p>
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
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : initials}
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
              aria-label="Змінити фото"
            >
              {avatarUploading ? 'Завантаження...' : 'Змінити фото'}
            </button>
            {(user.profile?.avatar_url || user.profile?.avatar || avatarPreview) && (
              <button
                className="btn-danger focus-ring"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                aria-label="Видалити фото"
              >
                Видалити фото
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
          <button className="btn-ghost focus-ring" onClick={logout}>Вийти</button>
        </motion.aside>

        <section className="profile-content">
          <div className="profile-tabs" role="tablist" aria-label="Profile tabs">
            {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                id={`tab-${tab}`}
                aria-controls={`panel-${tab}`}
                aria-selected={activeTab === tab}
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
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
                <h3>Профіль і доступ</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-first-name">Ім'я</label>
                    <input
                      id="profile-first-name"
                      className="input focus-ring"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      aria-label="Ім'я"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-last-name">Прізвище</label>
                    <input
                      id="profile-last-name"
                      className="input focus-ring"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      aria-label="Прізвище"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-org">Організація</label>
                    <input
                      id="profile-org"
                      className="input focus-ring"
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      aria-label="Організація"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-username">Нікнейм</label>
                    <input id="profile-username" className="input" value={user.username} readOnly aria-label="Нікнейм" />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="profile-email">Email</label>
                    <input id="profile-email" className="input" value={user.email} readOnly aria-label="Email" />
                  </div>
                </div>
                {profileError && <div className="profile-hint">{profileError}</div>}
                <div className="profile-actions-row">
                  <button className="btn-secondary focus-ring" onClick={handleSave} disabled={saving}>
                    {saving ? 'Збереження...' : 'Зберегти'}
                  </button>
                  <button
                    className="btn-ghost focus-ring"
                    onClick={() => setForm({
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                      organization: user.profile?.organization || '',
                      theme: (user.profile?.theme as 'light' | 'dark') || 'dark',
                      language: (user.profile?.language as 'uk' | 'en') || 'uk',
                      notify_email: user.profile?.notify_email ?? true,
                    })}
                    disabled={saving}
                  >
                    Скасувати
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
                <h3>Активність</h3>
                <div className="activity-list">
                  {activityLoading && activity.length === 0 && (
                    <>
                      <div className="skeleton" style={{ height: 64 }} />
                      <div className="skeleton" style={{ height: 64 }} />
                      <div className="skeleton" style={{ height: 64 }} />
                    </>
                  )}
                  {!activityLoading && activity.length === 0 && !activityError && (
                    <div className="profile-hint">Ще немає активності.</div>
                  )}
                  {activityError && <div className="profile-hint">{activityError}</div>}
                  {activity.map((entry) => (
                    <div key={entry.id} className="activity-item">
                      <div className="activity-icon">{entry.entity_type?.[0]?.toUpperCase() || '•'}</div>
                      <div>
                        <div className="activity-title">{getActivityTitle(entry)}</div>
                        <div className="activity-meta">
                          {entry.entity_type && `Тип: ${entry.entity_type}`} {entry.entity_id ? `#${entry.entity_id}` : ''}
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
                      {activityLoading ? 'Завантаження...' : 'Завантажити ще'}
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
                <h3>Налаштування</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <label className="profile-label">Тема</label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.theme === 'dark'}
                        onChange={(e) => setForm({ ...form, theme: e.target.checked ? 'dark' : 'light' })}
                        aria-label="Перемикач теми"
                      />
                      <span className="toggle-track" />
                      <span>{form.theme === 'dark' ? 'Темна' : 'Світла'}</span>
                    </label>
                  </div>
                  <div className="profile-field">
                    <label className="profile-label">Мова</label>
                    <select
                      className="input focus-ring"
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value as 'uk' | 'en' })}
                    >
                      <option value="uk">Українська</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="profile-field">
                    <label className="profile-label">Email повідомлення</label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.notify_email}
                        onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
                        aria-label="Email повідомлення"
                      />
                      <span className="toggle-track" />
                      <span>{form.notify_email ? 'Увімкнено' : 'Вимкнено'}</span>
                    </label>
                  </div>
                </div>
                {profileError && <div className="profile-hint">{profileError}</div>}
                <div className="profile-actions-row">
                  <button className="btn-secondary focus-ring" onClick={handleSave} disabled={saving}>
                    {saving ? 'Збереження...' : 'Зберегти налаштування'}
                  </button>
                  <button className="btn-danger focus-ring" disabled title="Потрібен бекенд endpoint">
                    Вийти з усіх пристроїв
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
