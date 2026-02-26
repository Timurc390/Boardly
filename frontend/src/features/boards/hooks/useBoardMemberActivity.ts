import { useCallback, useState } from 'react';
import { ActivityLog, Board } from '../../../types';
import { getBoardActivity } from '../api';

type BoardMember = NonNullable<Board['members']>[number];

type UseBoardMemberActivityOptions = {
  boardId?: number;
  openActivity: () => void;
  closeActivity: () => void;
};

export const useBoardMemberActivity = ({
  boardId,
  openActivity,
  closeActivity,
}: UseBoardMemberActivityOptions) => {
  const [activityMember, setActivityMember] = useState<BoardMember | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const openMemberActivity = useCallback(
    async (member: BoardMember) => {
      if (!boardId) return;
      openActivity();
      setActivityMember(member);
      setIsActivityLoading(true);
      try {
        const logs = await getBoardActivity(boardId, member.user.id);
        setActivityLogs(logs as ActivityLog[]);
      } catch {
        setActivityLogs([]);
      } finally {
        setIsActivityLoading(false);
      }
    },
    [boardId, openActivity]
  );

  const closeMemberActivity = useCallback(() => {
    closeActivity();
    setActivityMember(null);
  }, [closeActivity]);

  return {
    activityMember,
    activityLogs,
    isActivityLoading,
    openMemberActivity,
    closeMemberActivity,
  };
};
