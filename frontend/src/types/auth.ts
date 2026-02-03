export interface ProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  organization?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  language?: 'uk' | 'en' | 'pl' | 'de' | 'fr' | 'es';
  notify_email?: boolean;
  notify_desktop?: boolean;
  notify_assigned?: boolean;
  notify_due?: boolean;
  notify_added?: boolean;
  default_board_view?: 'kanban' | 'calendar';
  session_timeout?: string;
  two_factor_enabled?: boolean;
  require_login_verification?: boolean;
  avatar?: string | null;
  avatar_url?: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: ProfileData;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}
