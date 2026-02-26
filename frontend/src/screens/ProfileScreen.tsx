import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMoreHorizontal, FiSettings, FiShield, FiUser } from 'shared/ui/fiIcons';
import { useI18n } from '../context/I18nContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  deleteUserAccount,
  logoutUser,
} from '../store/slices/authSlice';
import { ProfileMobileMenu } from '../features/profile/components/ProfileMobileMenu';
import { ProfileDialogs } from '../features/profile/components/ProfileDialogs';
import { ProfileSidebar } from '../features/profile/components/ProfileSidebar';
import { ProfileTabContent } from '../features/profile/components/ProfileTabContent';
import { usePasswordChange } from '../features/profile/hooks/usePasswordChange';
import { getProfileActivityMessage, useProfileActivity } from '../features/profile/hooks/useProfileActivity';
import { useProfileForm } from '../features/profile/hooks/useProfileForm';
import { useProfilePrivacy } from '../features/profile/hooks/useProfilePrivacy';
import { type TabKey } from '../features/profile/types';

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

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAppSelector((state) => state.auth);
  const { t, locale, setLocale, supportedLocales } = useI18n();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [toast, setToast] = useState<string | null>(null);
  const [isEmailPrefsOpen, setIsEmailPrefsOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isMobileSettingsMenuOpen, setIsMobileSettingsMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const closeEmailPrefs = useCallback(() => setIsEmailPrefsOpen(false), []);
  const closeIntegrations = useCallback(() => setIsIntegrationsOpen(false), []);
  const closeDeactivate = useCallback(() => setIsDeactivateOpen(false), []);

  const {
    form,
    setForm,
    settingsPrefs,
    setSettingsPrefs,
    saving,
    handleSave,
    handleAvatarUpload,
    handleClearCache,
    handleComingSoon,
    avatarFailed,
    setAvatarFailed,
    resolvedAvatarUrlWithBuster,
  } = useProfileForm({
    dispatch,
    user,
    locale,
    setLocale,
    t,
    showToast,
  });

  const {
    passwordForm,
    setPasswordForm,
    showNewPassword,
    setShowNewPassword,
    isPasswordInstructionsOpen,
    setIsPasswordInstructionsOpen,
    handlePasswordChange,
  } = usePasswordChange({
    dispatch,
    passwordInitialized: user?.profile?.password_initialized !== false,
    t,
    showToast,
  });

  const closePasswordInstructions = useCallback(() => setIsPasswordInstructionsOpen(false), [setIsPasswordInstructionsOpen]);

  const privacyContent = useProfilePrivacy(locale);
  const { activityLogs, loadingActivity, clearActivity } = useProfileActivity(activeTab, token, t, showToast);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'profile' || tab === 'activity' || tab === 'settings' || tab === 'privacy') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    setIsMobileSettingsMenuOpen(false);
  }, [activeTab]);

  const logout = () => {
    dispatch(logoutUser());
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleAvatarUpload(file);
    event.target.value = '';
  };

  const handleDeleteAccount = async () => {
    try {
      await dispatch(deleteUserAccount()).unwrap();
      await dispatch(logoutUser()).unwrap();
      navigate('/');
    } catch {
      showToast(t('common.error'));
    }
  };

  const showCurrentPasswordField = user?.profile?.password_initialized !== false;

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
  const tabItems = (Object.keys(TAB_LABEL_KEYS) as TabKey[]).map((key) => ({
    key,
    label: t(TAB_LABEL_KEYS[key]),
    Icon: TAB_ICONS[key],
  }));

  if (!user) return <div className="loading-state">{t('common.loading')}</div>;

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <ProfileSidebar
          activeTab={activeTab}
          items={tabItems}
          onSelectTab={setActiveTab}
          onLogout={logout}
          backLabel={t('profile.backToMain')}
          logoutLabel={t('nav.logout')}
        />

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
                <FiMoreHorizontal aria-hidden="true" />
              </button>
            </div>
            <h1>{headerTitle}</h1>
            {headerSubtitle && <p>{headerSubtitle}</p>}
          </div>

          <ProfileMobileMenu
            isOpen={isMobileSettingsMenuOpen}
            activeTab={activeTab}
            items={tabItems}
            tabsLabel={t('profile.tabsLabel')}
            closeLabel={t('common.close')}
            backLabel={t('profile.backToMain')}
            logoutLabel={t('nav.logout')}
            onClose={() => setIsMobileSettingsMenuOpen(false)}
            onSelectTab={(key) => {
              setActiveTab(key);
              navigate(`/profile?tab=${key}`);
            }}
            onLogout={logout}
          />

          <ProfileTabContent
            activeTab={activeTab}
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
            onAvatarError={() => setAvatarFailed(true)}
            onSave={handleSave}
            onPasswordChange={handlePasswordChange}
            onAvatarUploadClick={() => fileInputRef.current?.click()}
            loadingActivity={loadingActivity}
            activityLogs={activityLogs}
            locale={locale}
            onClearActivity={clearActivity}
            getActivityMessage={(log) => getProfileActivityMessage(log, t, locale)}
            supportedLocales={supportedLocales}
            onClearCache={handleClearCache}
            privacyContent={privacyContent}
            t={t}
          />
        </main>
      </div>

      <ProfileDialogs
        isEmailPrefsOpen={isEmailPrefsOpen}
        isIntegrationsOpen={isIntegrationsOpen}
        isPasswordInstructionsOpen={isPasswordInstructionsOpen}
        isDeactivateOpen={isDeactivateOpen}
        form={form}
        settingsPrefs={settingsPrefs}
        saving={saving}
        onToggleNotifyEmail={(next) => setForm((prev) => ({ ...prev, notify_email: next }))}
        onToggleAssignedToTask={(next) => setSettingsPrefs((prev) => ({ ...prev, assignedToTask: next }))}
        onToggleDueDateApproaching={(next) => setSettingsPrefs((prev) => ({ ...prev, dueDateApproaching: next }))}
        onToggleAddedToBoard={(next) => setSettingsPrefs((prev) => ({ ...prev, addedToBoard: next }))}
        onCloseEmailPrefs={closeEmailPrefs}
        onCloseIntegrations={closeIntegrations}
        onClosePasswordInstructions={closePasswordInstructions}
        onCloseDeactivate={closeDeactivate}
        onSave={handleSave}
        onComingSoon={handleComingSoon}
        onDeleteAccount={handleDeleteAccount}
        t={t}
      />

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
};
