import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { ActivityLog } from '../types';
import { useI18n } from '../context/I18nContext';
import { type Locale } from '../i18n/translations';

import { useAppDispatch, useAppSelector } from '../store/hooks';

const API_URL = process.env.REACT_APP_API_URL || '/api';

type TabKey = 'profile' | 'activity' | 'settings';

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  profile: 'profile.tabs.profile',
  activity: 'profile.tabs.activity',
  settings: 'profile.tabs.settings',
};

const formatEntity = (name?: string, id?: number | null) => {
  if (name) return `«${name}»`;
  if (id) return `#${id}`;
  return '';
};

const getUserName = (log: ActivityLog) => {
  const u = (log as any).user;
  if (!u) return 'Користувач';
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return full || u.username || u.email || 'Користувач';
};

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const logout = () => {
    dispatch({ type: 'auth/logoutUser' });
  };

  const updateProfile = async (data: Partial<any>) => {
    return dispatch({ type: 'auth/updateUserProfile', payload: data });
  };

  const uploadAvatar = async (file: File) => {
    return dispatch({ type: 'auth/uploadUserAvatar', payload: file });
  };
  const { user, token } = useAppSelector(state => state.auth);
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    theme: 'dark', // За замовчуванням темна
    language: 'uk',
    notify_email: true,
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        organization: user.profile?.organization || '',
        theme: (user.profile?.theme as string) || 'dark',
        language: user.profile?.language || 'uk',
        notify_email: user.profile?.notify_email ?? true,
      });
    }
  }, [user]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        profile: {
          organization: form.organization,
          theme: form.theme as 'light' | 'dark',
          language: form.language as Locale, // ВИПРАВЛЕНО: Явне приведення типу для TypeScript
          notify_email: form.notify_email,
        }
      });
      
      // Update local locale if changed
      if (form.language !== locale) {
        setLocale(form.language as Locale);
      }
      
      showToast(t('profile.saved'));
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
        showToast(t('profile.avatarUpdated'));
      } catch {
        showToast(t('common.error'));
      }
    }
  };

  const avatarUrl = user?.profile?.avatar_url || user?.profile?.avatar;

  // Helper for activity messages
  const getActivityMessage = (log: ActivityLog) => {
    const meta = log.meta || {};
    const actor = getUserName(log);
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

    switch (log.action) {
      case 'create_board':
        return `${actor} створив(ла) дошку ${formatEntity(title, boardId)}`.trim();
      case 'rename_board':
        return `${actor} перейменував(ла) дошку ${formatEntity(title, boardId)}`.trim();
      case 'update_board':
        return `${actor} оновив(ла) дошку ${formatEntity(title, boardId)}`.trim();
      case 'archive_board':
        return `${actor} архівував(ла) дошку ${formatEntity(title, boardId)}`.trim();
      case 'unarchive_board':
        return `${actor} відновив(ла) дошку ${formatEntity(title, boardId)}`.trim();

      case 'create_list':
        return `${actor} додав(ла) список ${formatEntity(title, log.entity_id)}${boardTitle ? ` на дошці «${boardTitle}»` : boardId ? ` на дошці #${boardId}` : ''}`.trim();
      case 'rename_list':
        return `${actor} перейменував(ла) список ${formatEntity(title, log.entity_id)}`.trim();
      case 'move_list':
        return `${actor} переніс(ла) список ${formatEntity(title, log.entity_id)}${boardTitle ? ` на дошці «${boardTitle}»` : boardId ? ` на дошці #${boardId}` : ''}`.trim();
      case 'archive_list':
        return `${actor} архівував(ла) список ${formatEntity(title, log.entity_id)}`.trim();
      case 'unarchive_list':
        return `${actor} відновив(ла) список ${formatEntity(title, log.entity_id)}`.trim();
      case 'copy_list':
        return `${actor} скопіював(ла) список ${formatEntity(originalTitle, meta.original_id)} → ${formatEntity(title, log.entity_id)}`.trim();

      case 'create_card':
        return `${actor} додав(ла) картку ${formatEntity(title, cardId)}${listTitle ? ` до «${listTitle}»` : listId ? ` до списку #${listId}` : ''}`.trim();
      case 'move_card':
        return `${actor} переніс(ла) цю картку ${formatEntity(title, cardId)}${fromListTitle ? ` з «${fromListTitle}»` : fromList ? ` з #${fromList}` : ''}${toListTitle ? ` в «${toListTitle}»` : toList ? ` в #${toList}` : ''}`.trim();
      case 'archive_card':
        return `${actor} архівував(ла) картку ${formatEntity(title, cardId)}${listTitle ? ` у «${listTitle}»` : listId ? ` у списку #${listId}` : ''}`.trim();
      case 'unarchive_card':
        return `${actor} відновив(ла) картку ${formatEntity(title, cardId)}${listTitle ? ` у «${listTitle}»` : listId ? ` у списку #${listId}` : ''}`.trim();
      case 'update_card':
        return `${actor} оновив(ла) картку ${formatEntity(title, cardId)}`.trim();
      case 'update_card_description':
        return `${actor} оновив(ла) опис картки ${formatEntity(title, cardId)}`.trim();
      case 'update_card_due_date':
        return `${actor} змінив(ла) дедлайн картки ${formatEntity(title, cardId)} з ${dueBefore ? new Date(dueBefore).toLocaleString() : 'без дати'} на ${dueAfter ? new Date(dueAfter).toLocaleString() : 'без дати'}`.trim();
      case 'copy_card':
        return `${actor} скопіював(ла) картку ${formatEntity(originalTitle, meta.original_id)} → ${formatEntity(title, cardId)}`.trim();
      case 'complete_card':
        return `Учасник ${actor} позначив цю картку як завершену`.trim();
      case 'uncomplete_card':
        return `Учасник ${actor} зняв позначку завершення з цієї картки`.trim();

      case 'toggle_checklist_item':
        if (meta.is_checked === false) {
          return `${actor} позначив(ла) як не зроблене ${formatEntity(itemText, meta.item_id)}${checklistTitle ? ` у чек-листі «${checklistTitle}»` : ''}${title ? ` на цій картці «${title}»` : ''}`.trim();
        }
        return `${actor} позначив(ла) як зроблене ${formatEntity(itemText, meta.item_id)}${checklistTitle ? ` у чек-листі «${checklistTitle}»` : ''}${title ? ` на цій картці «${title}»` : ''}`.trim();
      case 'add_checklist_item':
        return `${actor} додав(ла) підзадачу ${formatEntity(itemText, meta.item_id)}${checklistTitle ? ` до чек-листа «${checklistTitle}»` : ''}${title ? ` у картці «${title}»` : ''}`.trim();
      case 'update_checklist_item':
        return `${actor} відредагував(ла) підзадачу ${formatEntity(itemText, meta.item_id)}${checklistTitle ? ` у чек-листі «${checklistTitle}»` : ''}${title ? ` у картці «${title}»` : ''}`.trim();
      case 'add_comment':
        return `${actor} залишив(ла) коментар ${formatEntity(commentText, meta.comment_id)}${title ? ` під карткою «${title}»` : ''}`.trim();
      case 'update_card_labels': {
        const added = addedLabels && addedLabels.length ? `додав(ла) мітки: ${addedLabels.join(', ')}` : '';
        const removed = removedLabels && removedLabels.length ? `видалив(ла) мітки: ${removedLabels.join(', ')}` : '';
        const parts = [added, removed].filter(Boolean).join('; ');
        return `${actor} ${parts || 'оновив(ла) мітки'} для картки ${formatEntity(title, cardId)}`.trim();
      }
      case 'create_label':
        return `${actor} створив(ла) мітку ${formatEntity(labelName, meta.label_id)}${boardTitle ? ` на дошці «${boardTitle}»` : ''}`.trim();
      case 'update_label':
        return `${actor} оновив(ла) мітку ${formatEntity(labelName, meta.label_id)}${boardTitle ? ` на дошці «${boardTitle}»` : ''}`.trim();
      case 'delete_label':
        return `${actor} видалив(ла) мітку ${formatEntity(labelName, meta.label_id)}${boardTitle ? ` на дошці «${boardTitle}»` : ''}`.trim();

      case 'update_profile':
        return `${actor} оновив(ла) профіль`;
      case 'update_avatar':
        return `${actor} оновив(ла) аватар`;
      case 'remove_avatar':
        return `${actor} видалив(ла) аватар`;

      default: {
        const target = title || itemText || (log.entity_id ? `#${log.entity_id}` : '');
        return `${actor} виконав(ла) дію ${target}`.trim();
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (!user) return <div className="loading-state">{t('common.loading')}</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="profile-user-card">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" />
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
            <p className="profile-username">@{user.username}</p>
            {user.profile?.organization && (
              <div className="profile-org-badge">
                🏢 {user.profile.organization}
              </div>
            )}
          </div>

          <nav className="profile-nav">
            {(Object.keys(TAB_LABEL_KEYS) as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`profile-nav-item ${activeTab === key ? 'active' : ''}`}
              >
                {t(TAB_LABEL_KEYS[key])}
              </button>
            ))}
          </nav>

          <button onClick={logout} className="profile-logout-btn">
            🚪 {t('nav.logout')}
          </button>
        </aside>

        {/* CONTENT AREA */}
        <main className="profile-content">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="profile-tab-content"
              >
                <h3>{t('profile.personalInfo')}</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t('profile.fields.firstName')}</label>
                    <input 
                      className="form-input"
                      value={form.first_name}
                      onChange={e => setForm({...form, first_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('profile.fields.lastName')}</label>
                    <input 
                      className="form-input"
                      value={form.last_name}
                      onChange={e => setForm({...form, last_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('profile.fields.organization')}</label>
                    <input 
                      className="form-input"
                      value={form.organization}
                      onChange={e => setForm({...form, organization: e.target.value})}
                      placeholder="Company Inc."
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('profile.fields.email')}</label>
                    <input 
                      className="form-input"
                      value={user.email}
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div 
                key="activity"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="profile-tab-content"
              >
                <h3>{t('profile.tabs.activity')}</h3>
                <div className="activity-list">
                  {loadingActivity ? (
                    <div className="loading-state">{t('common.loading')}</div>
                  ) : activityLogs.length === 0 ? (
                    <div className="empty-state">{t('activity.empty')}</div>
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
                className="profile-tab-content"
              >
                <h3>{t('profile.appSettings')}</h3>
                
                <div className="settings-section">
                  <div className="form-group">
                    <label>{t('profile.fields.theme')}</label>
                    <div className="theme-toggle">
                      <button 
                        className={`theme-option ${form.theme === 'light' ? 'active' : ''}`}
                        onClick={() => setForm({...form, theme: 'light'})}
                      >
                        ☀️ Light
                      </button>
                      <button 
                        className={`theme-option ${form.theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setForm({...form, theme: 'dark'})}
                      >
                        🌙 Dark
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('profile.fields.language')}</label>
                    <select 
                      className="form-input"
                      value={form.language}
                      onChange={e => setForm({...form, language: e.target.value})}
                    >
                      {supportedLocales.map(code => (
                        <option key={code} value={code}>
                          {t(`lang.${code}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={form.notify_email}
                        onChange={e => setForm({...form, notify_email: e.target.checked})}
                      />
                      {t('profile.fields.emailNotifications')}
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
