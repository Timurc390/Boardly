// Интерфейс Пользователя (User)
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: ProfileData;
}

// Данные профиля
export interface ProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  organization?: string;
  // Changed to strict union to fix TS2322 error in AuthScreens
  theme?: 'light' | 'dark';
  language?: 'uk' | 'en';
  notify_email?: boolean;
  avatar?: string | null;
  avatar_url?: string | null;
}

export interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  meta?: Record<string, any>;
  created_at: string;
}

// Интерфейс Вложения
export interface Attachment {
  id: number;
  file: string;
  name: string;
  uploaded_at: string;
}

// Интерфейс Карточки (Card)
export interface Card {
  id: number;
  title: string;
  description: string;
  order: number; 
  priority: 'low' | 'medium' | 'high';
  
  list: number; 
  
  assignees?: User[];
  attachments?: Attachment[];
  
  created_at?: string;
  updated_at?: string;
}

// Интерфейс Списка (List)
export interface List {
  id: number;
  title: string;
  order: number;
  
  cards: Card[]; 
}

// Интерфейс Доски (Board)
export interface Board {
  id: number;
  title: string;
  description?: string;
  background_url?: string;
  invite_link?: string;
  is_archived?: boolean;
  is_favorite?: boolean;
  
  owner?: User;
  members?: Array<{
    id: number;
    user: User;
    role: 'admin' | 'member';
  }>;
  
  lists: List[]; 
  
  created_at?: string;
  updated_at?: string;
  is_private?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}
