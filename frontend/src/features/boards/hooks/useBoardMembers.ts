import { useCallback, useMemo, useState } from 'react';
import { Board } from '../../../types';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { removeBoardMemberAction, updateBoardMemberRoleAction } from '../../../store/slices/boardSlice';
import { AppDispatch } from '../../../store/store';

type BoardMember = NonNullable<Board['members']>[number];

type UseBoardMembersOptions = {
  board: Board | null;
  canManageMembers: boolean;
  currentMembership: BoardMember | undefined;
  dispatch: AppDispatch;
  navigateToBoards: () => void;
  profileFallbackLabel: string;
  fallbackAvatar: string;
};

export const useBoardMembers = ({
  board,
  canManageMembers,
  currentMembership,
  dispatch,
  navigateToBoards,
  profileFallbackLabel,
  fallbackAvatar,
}: UseBoardMembersOptions) => {
  const [memberQuery, setMemberQuery] = useState('');
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);

  const getAvatarSrc = useCallback(
    (profile?: { avatar_url?: string | null; avatar?: string | null }) => {
      return resolveMediaUrl(profile?.avatar_url || profile?.avatar, fallbackAvatar);
    },
    [fallbackAvatar]
  );

  const getMemberDisplayName = useCallback(
    (memberUser: BoardMember['user']) => {
      const fullName = `${memberUser.first_name || ''} ${memberUser.last_name || ''}`.trim();
      return fullName || memberUser.username || memberUser.email || profileFallbackLabel;
    },
    [profileFallbackLabel]
  );

  const membersForDisplay = useMemo(() => {
    const list: Array<NonNullable<Board['owner']>> = [];
    const seen = new Set<number>();
    if (board?.owner) {
      list.push(board.owner);
      seen.add(board.owner.id);
    }
    (board?.members || []).forEach((member: BoardMember) => {
      if (!seen.has(member.user.id)) {
        list.push(member.user);
        seen.add(member.user.id);
      }
    });
    return list;
  }, [board?.members, board?.owner]);

  const headerMembers = useMemo(
    () =>
      membersForDisplay.map((userMember: BoardMember['user']) => ({
        user: userMember,
        membership: board?.members?.find((member: BoardMember) => member.user.id === userMember.id),
      })),
    [board?.members, membersForDisplay]
  );

  const visibleMembers = useMemo(() => membersForDisplay.slice(0, 4), [membersForDisplay]);

  const extraMembersCount = useMemo(
    () => Math.max(0, membersForDisplay.length - visibleMembers.length),
    [membersForDisplay.length, visibleMembers.length]
  );

  const normalizedMemberQuery = memberQuery.trim().toLowerCase();

  const filteredMembers = useMemo(
    () =>
      (board?.members || []).filter((member: BoardMember) => {
        if (!normalizedMemberQuery) return true;
        const displayName = getMemberDisplayName(member.user);
        const haystack = [displayName, member.user.username || '', member.user.email || '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedMemberQuery);
      }),
    [board?.members, getMemberDisplayName, normalizedMemberQuery]
  );

  const handleToggleMemberRole = useCallback(
    (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => {
      if (!canManageMembers) return;
      if (member.user.id === board?.owner?.id) return;
      dispatch(updateBoardMemberRoleAction({ membershipId: member.id, role }));
    },
    [board?.owner?.id, canManageMembers, dispatch]
  );

  const handleLeaveBoard = useCallback(async () => {
    if (!currentMembership) return;
    await dispatch(removeBoardMemberAction(currentMembership.id));
    navigateToBoards();
  }, [currentMembership, dispatch, navigateToBoards]);

  return {
    memberQuery,
    setMemberQuery,
    activeMemberId,
    setActiveMemberId,
    getAvatarSrc,
    getMemberDisplayName,
    headerMembers,
    visibleMembers,
    extraMembersCount,
    filteredMembers,
    handleToggleMemberRole,
    handleLeaveBoard,
    fallbackAvatar,
  };
};
