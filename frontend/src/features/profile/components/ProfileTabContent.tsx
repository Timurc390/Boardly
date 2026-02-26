import React from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { type ActivityLog } from '../../../types';
import { type Locale } from '../../../i18n/translations';
import { ActivityTab } from './ActivityTab';
import { PrivacyTab } from './PrivacyTab';
import { ProfileTab } from './ProfileTab';
import { SettingsTab } from './SettingsTab';
import {
  type PasswordFormState,
  type ProfileFormState,
  type ProfileSettingsPrefs,
  type ProfileUser,
  type TabKey,
  type TranslateFn,
} from '../types';

type PrivacyContent = {
  paragraphs: string[];
  translationNotice?: string;
  summaryTitle: string;
};

type ProfileTabContentProps = {
  activeTab: TabKey;
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
  loadingActivity: boolean;
  activityLogs: ActivityLog[];
  locale: Locale;
  onClearActivity: () => Promise<void>;
  getActivityMessage: (log: ActivityLog) => string;
  supportedLocales: Locale[];
  onClearCache: () => Promise<void>;
  privacyContent: PrivacyContent;
  t: TranslateFn;
};

export const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  activeTab,
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
  loadingActivity,
  activityLogs,
  locale,
  onClearActivity,
  getActivityMessage,
  supportedLocales,
  onClearCache,
  privacyContent,
  t,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = prefersReducedMotion
    ? {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
      exit: { opacity: 1, y: 0, transition: { duration: 0 } },
    }
    : {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    };

  return (
    <AnimatePresence mode="wait">
      {activeTab === 'profile' && (
        <motion.div
          key="profile"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ProfileTab
            user={user}
            form={form}
            setForm={setForm}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showCurrentPasswordField={showCurrentPasswordField}
            saving={saving}
            settingsPrefs={settingsPrefs}
            setSettingsPrefs={setSettingsPrefs}
            resolvedAvatarUrlWithBuster={resolvedAvatarUrlWithBuster}
            avatarFailed={avatarFailed}
            onAvatarError={onAvatarError}
            onSave={onSave}
            onPasswordChange={onPasswordChange}
            onAvatarUploadClick={onAvatarUploadClick}
            t={t}
          />
        </motion.div>
      )}

      {activeTab === 'activity' && (
        <motion.div
          key="activity"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ActivityTab
            loadingActivity={loadingActivity}
            activityLogs={activityLogs}
            locale={locale}
            onClearActivity={onClearActivity}
            getActivityMessage={getActivityMessage}
            t={t}
          />
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div
          key="settings"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <SettingsTab
            form={form}
            setForm={setForm}
            settingsPrefs={settingsPrefs}
            setSettingsPrefs={setSettingsPrefs}
            supportedLocales={supportedLocales}
            saving={saving}
            onSave={onSave}
            onClearCache={onClearCache}
            t={t}
          />
        </motion.div>
      )}

      {activeTab === 'privacy' && (
        <motion.div
          key="privacy"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <PrivacyTab privacyContent={privacyContent} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
