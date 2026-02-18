import { User } from './auth';

export interface Attachment {
  id: number;
  file: string;
  name?: string;
  uploaded_at: string;
}

export interface Comment {
  id: number;
  text: string;
  author: User;
  created_at: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  is_checked: boolean;
  order: number;
}

export interface Checklist {
  id: number;
  title: string;
  items: ChecklistItem[];
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface Card {
  id: number;
  title: string;
  description?: string;
  order: number;
  list: number; // List ID
  board: number; // Board ID (for convenience)
  
  // Details
  card_color?: string;
  cover_size?: 'full' | 'header';
  due_date?: string | null;
  is_completed?: boolean;
  is_archived?: boolean;
  
  // НОВЕ ПОЛЕ
  is_public?: boolean;
  
  // Relations
  members?: User[];
  labels?: Label[];
  label_ids?: number[]; 
  checklists?: Checklist[];
  attachments?: Attachment[];
  comments?: Comment[];
  
  created_at?: string;
  updated_at?: string;
}

export interface List {
  id: number;
  title: string;
  board: number;
  order: number;
  is_archived?: boolean;
  color?: string | null;
  allow_dev_add_cards?: boolean;
  cards?: Card[];
}

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
    role: 'admin' | 'developer' | 'viewer';
    is_favorite?: boolean;
  }>;
  
  lists?: List[];
  labels?: Label[];

  dev_can_create_cards?: boolean;
  dev_can_edit_assigned_cards?: boolean;
  dev_can_archive_assigned_cards?: boolean;
  dev_can_join_card?: boolean;
  dev_can_create_lists?: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  meta?: Record<string, any>;
  created_at: string;
  user?: User;
}
