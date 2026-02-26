import { useEffect, useMemo, useState } from 'react';
import { type Locale } from '../../../i18n/translations';
import {
  sendEmailVerification,
  updateUserProfile,
  uploadUserAvatar,
} from '../../../store/slices/authSlice';
import { type AppDispatch } from '../../../store/store';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { type ProfileFormState, type ProfileSettingsPrefs, type ProfileUser, type TranslateFn } from '../types';

const INITIAL_SETTINGS_PREFS: ProfileSettingsPrefs = {
  desktopNotifications: true,
  assignedToTask: true,
  dueDateApproaching: true,
  addedToBoard: true,
};

const INITIAL_FORM: ProfileFormState = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  organization: '',
  bio: '',
  theme: 'dark',
  language: 'uk',
  notify_email: true,
  activity_retention: '30d',
};

type UseProfileFormParams = {
  dispatch: AppDispatch;
  user: ProfileUser | null;
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: TranslateFn;
  showToast: (message: string) => void;
};

export const useProfileForm = ({
  dispatch,
  user,
  locale,
  setLocale,
  t,
  showToast,
}: UseProfileFormParams) => {
  const [form, setForm] = useState<ProfileFormState>(INITIAL_FORM);
  const [settingsPrefs, setSettingsPrefs] = useState<ProfileSettingsPrefs>(INITIAL_SETTINGS_PREFS);
  const [saving, setSaving] = useState(false);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState<number>(Date.now());
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('settingsPrefs');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Partial<ProfileSettingsPrefs>;
      setSettingsPrefs((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('settingsPrefs', JSON.stringify(settingsPrefs));
  }, [settingsPrefs]);

  useEffect(() => {
    if (!user) return;

    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
      organization: user.profile?.organization || '',
      bio: user.profile?.bio || '',
      theme: 'dark',
      language: user.profile?.language || 'uk',
      notify_email: user.profile?.notify_email ?? true,
      activity_retention: user.profile?.activity_retention || '30d',
    });

    setSettingsPrefs((prev) => ({
      ...prev,
      desktopNotifications: user.profile?.notify_desktop ?? prev.desktopNotifications,
      assignedToTask: user.profile?.notify_assigned ?? prev.assignedToTask,
      dueDateApproaching: user.profile?.notify_due ?? prev.dueDateApproaching,
      addedToBoard: user.profile?.notify_added ?? prev.addedToBoard,
    }));
  }, [user]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = 'dark';
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', 'dark');
    }
  }, [form.theme]);

  const rawAvatarUrl = user?.profile?.avatar_url || '';
  const rawAvatarPath = user?.profile?.avatar || '';
  const resolvedAvatarUrl = useMemo(() => resolveMediaUrl(rawAvatarUrl || rawAvatarPath), [rawAvatarUrl, rawAvatarPath]);

  const resolvedAvatarUrlWithBuster = useMemo(() => {
    if (!resolvedAvatarUrl) return '';
    if (resolvedAvatarUrl.startsWith('data:')) return resolvedAvatarUrl;
    const separator = resolvedAvatarUrl.includes('?') ? '&' : '?';
    return `${resolvedAvatarUrl}${separator}v=${avatarCacheBuster}`;
  }, [resolvedAvatarUrl, avatarCacheBuster]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [resolvedAvatarUrl]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const emailChanged = form.email !== (user.email || '');
      await dispatch(updateUserProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        profile: {
          organization: form.organization,
          bio: form.bio,
          theme: 'dark',
          language: form.language,
          notify_email: form.notify_email,
          activity_retention: form.activity_retention,
          notify_desktop: settingsPrefs.desktopNotifications,
          notify_assigned: settingsPrefs.assignedToTask,
          notify_due: settingsPrefs.dueDateApproaching,
          notify_added: settingsPrefs.addedToBoard,
        },
      })).unwrap();

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
    } catch {
      showToast(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await dispatch(uploadUserAvatar(file)).unwrap();
      setAvatarFailed(false);
      setAvatarCacheBuster(Date.now());
      showToast(t('profile.toast.avatarUpdated'));
    } catch {
      showToast(t('common.error'));
    }
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
          await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
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

  return {
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
  };
};
