export interface ProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  organization?: string;
  theme?: 'light' | 'dark';
  language?: 'uk' | 'en' | 'pl' | 'de' | 'fr' | 'es';
  notify_email?: boolean;
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