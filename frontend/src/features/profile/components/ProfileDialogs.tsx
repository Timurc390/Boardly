import React, { useCallback, useRef } from 'react';
import { FiX } from 'shared/ui/fiIcons';
import { useDialogA11y } from '../../../shared/hooks/useDialogA11y';

type ProfileForm = {
  notify_email: boolean;
};

type SettingsPrefs = {
  assignedToTask: boolean;
  dueDateApproaching: boolean;
  addedToBoard: boolean;
};

type ProfileDialogsProps = {
  isEmailPrefsOpen: boolean;
  isIntegrationsOpen: boolean;
  isPasswordInstructionsOpen: boolean;
  isDeactivateOpen: boolean;
  form: ProfileForm;
  settingsPrefs: SettingsPrefs;
  saving: boolean;
  onToggleNotifyEmail: (next: boolean) => void;
  onToggleAssignedToTask: (next: boolean) => void;
  onToggleDueDateApproaching: (next: boolean) => void;
  onToggleAddedToBoard: (next: boolean) => void;
  onCloseEmailPrefs: () => void;
  onCloseIntegrations: () => void;
  onClosePasswordInstructions: () => void;
  onCloseDeactivate: () => void;
  onSave: () => Promise<unknown>;
  onComingSoon: () => void;
  onDeleteAccount: () => Promise<void>;
  t: (key: string) => string;
};

export const ProfileDialogs: React.FC<ProfileDialogsProps> = ({
  isEmailPrefsOpen,
  isIntegrationsOpen,
  isPasswordInstructionsOpen,
  isDeactivateOpen,
  form,
  settingsPrefs,
  saving,
  onToggleNotifyEmail,
  onToggleAssignedToTask,
  onToggleDueDateApproaching,
  onToggleAddedToBoard,
  onCloseEmailPrefs,
  onCloseIntegrations,
  onClosePasswordInstructions,
  onCloseDeactivate,
  onSave,
  onComingSoon,
  onDeleteAccount,
  t,
}) => {
  const emailPrefsDialogRef = useRef<HTMLDivElement>(null);
  const integrationsDialogRef = useRef<HTMLDivElement>(null);
  const passwordInstructionsDialogRef = useRef<HTMLDivElement>(null);
  const deactivateDialogRef = useRef<HTMLDivElement>(null);

  useDialogA11y({ isOpen: isEmailPrefsOpen, onClose: onCloseEmailPrefs, dialogRef: emailPrefsDialogRef });
  useDialogA11y({ isOpen: isIntegrationsOpen, onClose: onCloseIntegrations, dialogRef: integrationsDialogRef });
  useDialogA11y({ isOpen: isPasswordInstructionsOpen, onClose: onClosePasswordInstructions, dialogRef: passwordInstructionsDialogRef });
  useDialogA11y({ isOpen: isDeactivateOpen, onClose: onCloseDeactivate, dialogRef: deactivateDialogRef });

  const handleSaveEmailPrefs = useCallback(async () => {
    await onSave();
    onCloseEmailPrefs();
  }, [onCloseEmailPrefs, onSave]);

  const handleDeactivate = useCallback(async () => {
    onCloseDeactivate();
    await onDeleteAccount();
  }, [onCloseDeactivate, onDeleteAccount]);

  return (
    <>
      {isEmailPrefsOpen && (
        <div className="settings-modal-overlay" onClick={onCloseEmailPrefs}>
          <div
            ref={emailPrefsDialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-prefs-modal-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="settings-modal-close" onClick={onCloseEmailPrefs} aria-label={t('common.close')}>
              <FiX aria-hidden="true" />
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
                    onChange={(event) => onToggleNotifyEmail(event.target.checked)}
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
                    onChange={(event) => onToggleAssignedToTask(event.target.checked)}
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
                    onChange={(event) => onToggleDueDateApproaching(event.target.checked)}
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
                    onChange={(event) => onToggleAddedToBoard(event.target.checked)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            </div>
            <div className="settings-modal-actions">
              <button
                className="settings-btn settings-btn-primary"
                type="button"
                onClick={() => { void handleSaveEmailPrefs(); }}
                disabled={saving}
              >
                {saving ? t('common.saving') : t('profile.settings.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isIntegrationsOpen && (
        <div className="settings-modal-overlay" onClick={onCloseIntegrations}>
          <div
            ref={integrationsDialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="integrations-modal-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="settings-modal-close" onClick={onCloseIntegrations} aria-label={t('common.close')}>
              <FiX aria-hidden="true" />
            </button>
            <div className="settings-modal-title" id="integrations-modal-title">{t('profile.integrations.title')}</div>
            <div className="settings-modal-subtitle">{t('profile.integrations.subtitle')}</div>
            <div className="settings-modal-content integrations-list">
              <div className="integration-item">
                <div>
                  <div className="integration-name">Slack</div>
                  <div className="integration-desc">{t('profile.integrations.slack')}</div>
                </div>
                <button className="settings-btn settings-btn-secondary" type="button" onClick={onComingSoon}>
                  {t('profile.integrations.connect')}
                </button>
              </div>
              <div className="integration-item">
                <div>
                  <div className="integration-name">Google Calendar</div>
                  <div className="integration-desc">{t('profile.integrations.calendar')}</div>
                </div>
                <button className="settings-btn settings-btn-secondary" type="button" onClick={onComingSoon}>
                  {t('profile.integrations.connect')}
                </button>
              </div>
              <div className="integration-item">
                <div>
                  <div className="integration-name">GitHub</div>
                  <div className="integration-desc">{t('profile.integrations.github')}</div>
                </div>
                <button className="settings-btn settings-btn-secondary" type="button" onClick={onComingSoon}>
                  {t('profile.integrations.connect')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPasswordInstructionsOpen && (
        <div className="settings-modal-overlay" onClick={onClosePasswordInstructions}>
          <div
            ref={passwordInstructionsDialogRef}
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-instructions-modal-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="settings-modal-close"
              onClick={onClosePasswordInstructions}
              aria-label={t('common.close')}
            >
              <FiX aria-hidden="true" />
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
                onClick={onClosePasswordInstructions}
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeactivateOpen && (
        <div className="attention-overlay" onClick={onCloseDeactivate}>
          <div
            ref={deactivateDialogRef}
            className="attention-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-modal-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="attention-close" onClick={onCloseDeactivate} aria-label={t('common.close')}>
              <FiX aria-hidden="true" />
            </button>
            <div className="attention-title" id="deactivate-modal-title">{t('profile.deactivate.title')}</div>
            <div className="attention-text">{t('profile.deactivate.message')}</div>
            <button
              className="attention-action"
              type="button"
              onClick={() => { void handleDeactivate(); }}
            >
              {t('profile.deactivate.confirm')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
