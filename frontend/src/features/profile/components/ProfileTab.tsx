import React from 'react';
import { type PasswordFormState, type ProfileFormState, type ProfileSettingsPrefs, type ProfileUser, type TranslateFn } from '../types';

type ProfileTabProps = {
  user: ProfileUser;
  form: ProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  passwordForm: PasswordFormState;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormState>>;
  showNewPassword: boolean;
  setShowNewPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showCurrentPasswordField: boolean;
  saving: boolean;
  settingsPrefs: ProfileSettingsPrefs;
  setSettingsPrefs: React.Dispatch<React.SetStateAction<ProfileSettingsPrefs>>;
  resolvedAvatarUrlWithBuster: string;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onSave: () => Promise<void>;
  onPasswordChange: () => Promise<void>;
  onAvatarUploadClick: () => void;
  t: TranslateFn;
};

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  form,
  setForm,
  passwordForm,
  setPasswordForm,
  showNewPassword,
  setShowNewPassword,
  showCurrentPasswordField,
  saving,
  settingsPrefs,
  setSettingsPrefs,
  resolvedAvatarUrlWithBuster,
  avatarFailed,
  onAvatarError,
  onSave,
  onPasswordChange,
  onAvatarUploadClick,
  t,
}) => {
  return (
    <div className="profile-grid">
      <section className="profile-card personal-info">
        <div className="profile-card-title">{t('profile.section.personalInfo')}</div>
        <div className="profile-personal-grid">
          <div className="profile-avatar-col">
            <div className="profile-avatar-large">
              {resolvedAvatarUrlWithBuster && !avatarFailed ? (
                <img src={resolvedAvatarUrlWithBuster} alt={t('profile.avatarAlt')} loading="lazy" decoding="async" onError={onAvatarError} />
              ) : (
                <span>{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button className="profile-btn-secondary avatar-btn" onClick={onAvatarUploadClick}>
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
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  autoComplete="given-name"
                  name="first_name"
                />
              </div>
              <div className="form-group inline-field">
                <label>{t('profile.fields.lastName')}</label>
                <input
                  className="form-input input-last"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
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
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                name="username"
              />
            </div>
            <div className="form-group">
              <label>{t('profile.fields.email')}</label>
              <input
                className="form-input input-wide"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                name="email"
              />
            </div>
            <div className="profile-card-actions">
              <button className="profile-btn-primary save-btn" onClick={onSave} disabled={saving}>
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
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
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
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
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
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
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
          <button className="profile-btn-verify" onClick={onPasswordChange}>
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
                onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
        <div className="profile-form-grid one-col">
          <div className="form-group">
            <label>{t('profile.fields.organization')}</label>
            <input
              className="form-input work-input"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
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
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
    </div>
  );
};
