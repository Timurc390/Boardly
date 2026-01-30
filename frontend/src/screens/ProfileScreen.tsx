import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
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
  settings: 'profile.tabs.settings',
  privacy: 'profile.tabs.privacy',
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
    const confirmed = window.confirm('Ви впевнені, що хочете видалити акаунт? Це дію неможливо скасувати.');
    if (!confirmed) return;
    try {
      await dispatch(deleteUserAccount()).unwrap();
      await dispatch(logoutUser());
      navigate('/');
    } catch (e) {
      console.error(e);
      showToast(t('common.error'));
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
      <div className="profile-shell">
        <aside className="profile-side">
          <div className="profile-side-brand">Boardly</div>
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
            <p className="profile-username">{user.email}</p>
          </div>

          <nav className="profile-nav">
            {(Object.keys(TAB_LABEL_KEYS) as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`profile-nav-item ${activeTab === key ? 'active' : ''}`}
              >
                {key === 'privacy' ? 'Privacy policy' : t(TAB_LABEL_KEYS[key])}
              </button>
            ))}
          </nav>

          <Link to="/boards" className="profile-back-link">← Back to main page</Link>
        </aside>

        <main className="profile-main">
          <div className="profile-header">
            {activeTab === 'privacy' ? (
              <>
                <h1>Privacy policy</h1>
                <p>Protect your personal information</p>
              </>
            ) : (
              <>
                <h1>Profile settings</h1>
                <p>Manage your personal information</p>
              </>
            )}
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
                  <div className="profile-card-title">Personal Info</div>
                  <div className="profile-personal-grid">
                    <div className="profile-avatar-col">
                      <div className="profile-avatar-large">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <button className="profile-btn-secondary avatar-btn" onClick={() => fileInputRef.current?.click()}>
                        Change Photo
                      </button>
                      <button className="profile-btn-danger avatar-btn" onClick={deleteAvatar}>
                        Remove Photo
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
                          />
                        </div>
                        <div className="form-group inline-field">
                          <label>{t('profile.fields.lastName')}</label>
                          <input 
                            className="form-input input-last"
                            value={form.last_name}
                            onChange={e => setForm({...form, last_name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Username</label>
                        <input 
                          className="form-input input-wide" 
                          value={form.username}
                          onChange={e => setForm({...form, username: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input 
                          className="form-input input-wide" 
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
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
                  <div className="profile-card-title">Password change</div>
                  <div className="profile-form-grid one-col">
                    <div className="form-group">
                      <label>Old Password</label>
                      <input 
                        className="form-input" 
                        type="password" 
                        value={passwordForm.current_password}
                        onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          className="form-input" 
                          type={showNewPassword ? 'text' : 'password'} 
                          value={passwordForm.new_password}
                          onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          className="form-input" 
                          type={showNewPassword ? 'text' : 'password'} 
                          value={passwordForm.confirm_password}
                          onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="profile-card-actions">
                    <button className="profile-btn-verify" onClick={handlePasswordChange}>
                      Change password
                    </button>
                  </div>
                </section>

                <section className="profile-card work-info">
                  <div className="work-info-header">
                    <div className="profile-card-title">Work Info</div>
                    <div className="work-public-row">
                      <span className="work-public-label">Public</span>
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
                      <label>Role or Organization</label>
                      <input 
                        className="form-input work-input"
                        value={form.organization}
                        onChange={e => setForm({...form, organization: e.target.value})}
                        placeholder="Role / Company"
                      />
                    </div>
                    <div className="form-group">
                      <label>Add your bio</label>
                      <textarea
                        className="form-input work-bio"
                        value={form.bio}
                        onChange={e => setForm({...form, bio: e.target.value})}
                        placeholder="Tell us about yourself"
                      />
                    </div>
                  </div>
                </section>

                <section className="profile-card access">
                  <div className="profile-card-title">Access</div>
                  <div className="profile-card-actions column">
                    <button className="profile-btn-secondary" onClick={logout}>Log out</button>
                    <button className="profile-btn-danger" onClick={handleDeleteAccount}>
                      Deactivate your account
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
                className="profile-card"
              >
                <div className="profile-card-title">{t('profile.appSettings')}</div>
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

                <div className="profile-card-actions">
                  <button className="profile-btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
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
    </div>
  );
};
