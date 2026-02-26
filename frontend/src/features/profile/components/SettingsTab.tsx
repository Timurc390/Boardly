import React from 'react';
import { type Locale } from '../../../i18n/translations';
import { type ProfileFormState, type ProfileSettingsPrefs, type TranslateFn } from '../types';

type SettingsTabProps = {
  form: ProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  settingsPrefs: ProfileSettingsPrefs;
  setSettingsPrefs: React.Dispatch<React.SetStateAction<ProfileSettingsPrefs>>;
  supportedLocales: Locale[];
  saving: boolean;
  onSave: () => Promise<void>;
  onClearCache: () => Promise<void>;
  t: TranslateFn;
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  form,
  setForm,
  settingsPrefs,
  setSettingsPrefs,
  supportedLocales,
  saving,
  onSave,
  onClearCache,
  t,
}) => {
  return (
    <div className="settings-layout">
      <section className="settings-card settings-card-general">
        <div className="settings-card-title">{t('profile.settings.general')}</div>
        <div className="settings-field settings-field-language">
          <label>{t('profile.settings.language')}</label>
          <select
            className="form-input settings-select"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value as Locale })}
          >
            {supportedLocales.map((code) => (
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
            onChange={(e) => setForm({ ...form, activity_retention: e.target.value as '7d' | '30d' | '365d' })}
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
              onChange={(e) => setSettingsPrefs((prev) => ({ ...prev, desktopNotifications: e.target.checked }))}
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
              onChange={(e) => setSettingsPrefs((prev) => ({ ...prev, assignedToTask: e.target.checked }))}
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
              onChange={(e) => setSettingsPrefs((prev) => ({ ...prev, dueDateApproaching: e.target.checked }))}
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
              onChange={(e) => setSettingsPrefs((prev) => ({ ...prev, addedToBoard: e.target.checked }))}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>
        <div className="settings-general-actions">
          <button className="settings-btn settings-btn-accent" type="button" onClick={onClearCache}>
            {t('profile.settings.clearCache')}
          </button>
          <button className="settings-btn settings-btn-primary" type="button" onClick={onSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </section>
    </div>
  );
};
