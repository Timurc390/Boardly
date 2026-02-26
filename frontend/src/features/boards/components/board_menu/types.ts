import { type Board, type Card, type List } from '../../../../types';

export type BoardMenuTab = 'main' | 'background' | 'members' | 'archived' | 'permissions';

export type BoardMember = NonNullable<Board['members']>[number];

export type BackgroundOption = {
  key: string;
  value: string;
  label: string;
  preview?: string;
};

export type TranslateFn = (key: string) => string;

export type SidebarCommonProps = {
  t: TranslateFn;
  board: Board;
};

export type BackgroundSectionProps = SidebarCommonProps & {
  colorOptions: BackgroundOption[];
  gradientOptions: BackgroundOption[];
  imageOptions: BackgroundOption[];
  bgUrlInput: string;
  onBgUrlInputChange: (value: string) => void;
  onBackgroundSelect: (value: string) => void;
  onBackgroundFile: (file?: File | null) => void;
};

export type MembersSectionProps = SidebarCommonProps & {
  memberQuery: string;
  onMemberQueryChange: (value: string) => void;
  filteredMembers: BoardMember[];
  activeMemberId: number | null;
  onToggleActiveMember: (id: number | null) => void;
  getMemberDisplayName: (user: BoardMember['user']) => string;
  getAvatarSrc: (profile?: { avatar_url?: string | null; avatar?: string | null }) => string;
  fallbackAvatar: string;
  onOpenMemberActivity: (member: BoardMember) => void;
  onToggleMemberRole: (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => void;
  onRemoveMember: (membershipId: number) => void;
  canManageMembers: boolean;
  currentUserId?: number;
};

export type ArchivedSectionProps = SidebarCommonProps & {
  archivedLists: List[];
  archivedCards: Card[];
  onUnarchiveList: (listId: number) => void;
  onDeleteList: (listId: number) => void;
  onUnarchiveCard: (cardId: number) => void;
  onDeleteCard: (cardId: number) => void;
};

export type PermissionsSectionProps = SidebarCommonProps & {
  onUpdateBoardSettings: (data: Partial<Board>) => void;
};

export type MainSectionProps = SidebarCommonProps & {
  canEditBoard: boolean;
  canManageMembers: boolean;
  canLeaveBoard: boolean;
  isOwner: boolean;
  inviteLink: string;
  onInvite: () => void;
  onArchiveToggle: () => void;
  onDeleteBoard: () => void;
  onLeaveBoard: () => void;
  onLogout: () => void;
  onClose: () => void;
  onTabChange: (tab: BoardMenuTab) => void;
};
