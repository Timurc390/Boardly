import { type Locale } from '../../i18n/translations';
import { type ActivityLog, type User } from '../../types';

export type TabKey = 'profile' | 'activity' | 'settings' | 'privacy';

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type ProfileSettingsPrefs = {
  desktopNotifications: boolean;
  assignedToTask: boolean;
  dueDateApproaching: boolean;
  addedToBoard: boolean;
};

export type ProfileFormState = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  organization: string;
  bio: string;
  theme: 'dark';
  language: Locale;
  notify_email: boolean;
  activity_retention: '7d' | '30d' | '365d';
};

export type PasswordFormState = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type UseProfileActivityResult = {
  activityLogs: ActivityLog[];
  loadingActivity: boolean;
  clearActivity: () => Promise<void>;
};

export type ProfileUser = User;
