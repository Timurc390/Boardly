// Интерфейс Пользователя (User)
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
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
  
  owner?: User;
  
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