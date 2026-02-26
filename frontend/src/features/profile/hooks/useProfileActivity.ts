import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { type Locale } from '../../../i18n/translations';
import { type ActivityLog } from '../../../types';
import { type TranslateFn } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const formatEntity = (name?: string, id?: number | null) => {
  if (name) return `«${name}»`;
  if (id) return `#${id}`;
  return '';
};

const getUserName = (log: ActivityLog, fallback: string) => {
  const profileUser = log.user;
  if (!profileUser) return fallback;
  const full = [profileUser.first_name, profileUser.last_name].filter(Boolean).join(' ').trim();
  return full || profileUser.username || profileUser.email || fallback;
};

export const getProfileActivityMessage = (log: ActivityLog, t: TranslateFn, locale: Locale) => {
  const meta = log.meta || {};
  const actor = getUserName(log, t('profile.userFallback'));
  const title = meta.title as string | undefined;
  const itemText = meta.item_text as string | undefined;
  const boardId = meta.board_id as number | undefined;
  const listId = meta.list as number | undefined;
  const fromList = meta.from_list as number | undefined;
  const toList = meta.to_list as number | undefined;
  const cardId = meta.card_id as number | undefined;
  const listTitle = meta.list_title as string | undefined;
  const fromListTitle = meta.from_list_title as string | undefined;
  const toListTitle = meta.to_list_title as string | undefined;
  const boardTitle = meta.board_title as string | undefined;
  const dueBefore = meta.due_before as string | undefined;
  const dueAfter = meta.due_after as string | undefined;
  const addedLabels = meta.added_labels as string[] | undefined;
  const removedLabels = meta.removed_labels as string[] | undefined;
  const labelName = meta.label_name as string | undefined;
  const commentText = meta.comment_text as string | undefined;
  const originalTitle = meta.original_title as string | undefined;
  const checklistTitle = meta.checklist_title as string | undefined;

  const space = (value?: string) => (value ? ` ${value}` : '');
  const boardContext = space(boardTitle || boardId ? t('activity.context.onBoard', { board: formatEntity(boardTitle, boardId) }) : '');
  const toListContext = space(listTitle || listId ? t('activity.context.toList', { list: formatEntity(listTitle, listId) }) : '');
  const moveToListContext = space(toListTitle || toList ? t('activity.context.toList', { list: formatEntity(toListTitle, toList) }) : '');
  const fromListContext = space(fromListTitle || fromList ? t('activity.context.fromList', { list: formatEntity(fromListTitle, fromList) }) : '');
  const inListContext = space(listTitle || listId ? t('activity.context.inList', { list: formatEntity(listTitle, listId) }) : '');
  const checklistContext = space(checklistTitle || (meta.checklist_id as number | undefined)
    ? t('activity.context.inChecklist', { checklist: formatEntity(checklistTitle, meta.checklist_id as number | undefined) })
    : '');
  const cardContext = space(title || cardId ? t('activity.context.onCard', { card: formatEntity(title, cardId) }) : '');

  switch (log.action) {
    case 'create_board':
      return t('activity.create_board', { actor, board: formatEntity(title, boardId) }).trim();
    case 'rename_board':
      return t('activity.rename_board', { actor, board: formatEntity(title, boardId) }).trim();
    case 'update_board':
      return t('activity.update_board', { actor, board: formatEntity(title, boardId) }).trim();
    case 'archive_board':
      return t('activity.archive_board', { actor, board: formatEntity(title, boardId) }).trim();
    case 'unarchive_board':
      return t('activity.unarchive_board', { actor, board: formatEntity(title, boardId) }).trim();

    case 'create_list':
      return t('activity.create_list', { actor, list: formatEntity(title, log.entity_id), context: boardContext }).trim();
    case 'rename_list':
      return t('activity.rename_list', { actor, list: formatEntity(title, log.entity_id) }).trim();
    case 'move_list':
      return t('activity.move_list', { actor, list: formatEntity(title, log.entity_id), context: boardContext }).trim();
    case 'archive_list':
      return t('activity.archive_list', { actor, list: formatEntity(title, log.entity_id) }).trim();
    case 'unarchive_list':
      return t('activity.unarchive_list', { actor, list: formatEntity(title, log.entity_id) }).trim();
    case 'copy_list':
      return t('activity.copy_list', { actor, source: formatEntity(originalTitle, meta.original_id as number | undefined), target: formatEntity(title, log.entity_id) }).trim();

    case 'create_card':
      return t('activity.create_card', { actor, card: formatEntity(title, cardId), context: toListContext }).trim();
    case 'move_card':
      return t('activity.move_card', { actor, card: formatEntity(title, cardId), from: fromListContext, to: moveToListContext }).trim();
    case 'archive_card':
      return t('activity.archive_card', { actor, card: formatEntity(title, cardId), context: inListContext }).trim();
    case 'unarchive_card':
      return t('activity.unarchive_card', { actor, card: formatEntity(title, cardId), context: inListContext }).trim();
    case 'update_card':
      return t('activity.update_card', { actor, card: formatEntity(title, cardId) }).trim();
    case 'update_card_description':
      return t('activity.update_card_description', { actor, card: formatEntity(title, cardId) }).trim();
    case 'update_card_due_date': {
      const before = dueBefore ? new Date(dueBefore).toLocaleString(locale) : t('activity.noDate');
      const after = dueAfter ? new Date(dueAfter).toLocaleString(locale) : t('activity.noDate');
      return t('activity.update_card_due_date', { actor, card: formatEntity(title, cardId), before, after }).trim();
    }
    case 'copy_card':
      return t('activity.copy_card', { actor, source: formatEntity(originalTitle, meta.original_id as number | undefined), target: formatEntity(title, cardId) }).trim();
    case 'complete_card':
      return t('activity.complete_card', { actor }).trim();
    case 'uncomplete_card':
      return t('activity.uncomplete_card', { actor }).trim();

    case 'toggle_checklist_item':
      if (meta.is_checked === false) {
        return t('activity.checklist.unchecked', { actor, item: formatEntity(itemText, meta.item_id as number | undefined), checklist: checklistContext, card: cardContext }).trim();
      }
      return t('activity.checklist.checked', { actor, item: formatEntity(itemText, meta.item_id as number | undefined), checklist: checklistContext, card: cardContext }).trim();
    case 'add_checklist_item':
      return t('activity.add_checklist_item', { actor, item: formatEntity(itemText, meta.item_id as number | undefined), checklist: checklistContext, card: cardContext }).trim();
    case 'update_checklist_item':
      return t('activity.update_checklist_item', { actor, item: formatEntity(itemText, meta.item_id as number | undefined), checklist: checklistContext, card: cardContext }).trim();
    case 'add_comment':
      return t('activity.add_comment', { actor, comment: formatEntity(commentText, meta.comment_id as number | undefined), card: cardContext }).trim();
    case 'update_card_labels': {
      const added = addedLabels && addedLabels.length ? t('activity.labels.added', { labels: addedLabels.join(', ') }) : '';
      const removed = removedLabels && removedLabels.length ? t('activity.labels.removed', { labels: removedLabels.join(', ') }) : '';
      const changes = [added, removed].filter(Boolean).join('; ');
      return t('activity.update_card_labels', { actor, changes: changes || t('activity.labels.updated'), card: formatEntity(title, cardId) }).trim();
    }
    case 'create_label':
      return t('activity.create_label', { actor, label: formatEntity(labelName, meta.label_id as number | undefined), context: boardContext }).trim();
    case 'update_label':
      return t('activity.update_label', { actor, label: formatEntity(labelName, meta.label_id as number | undefined), context: boardContext }).trim();
    case 'delete_label':
      return t('activity.delete_label', { actor, label: formatEntity(labelName, meta.label_id as number | undefined), context: boardContext }).trim();

    case 'update_profile':
      return t('activity.update_profile', { actor }).trim();
    case 'update_avatar':
      return t('activity.update_avatar', { actor }).trim();
    case 'remove_avatar':
      return t('activity.remove_avatar', { actor }).trim();

    default: {
      const target = title || itemText || (log.entity_id ? `#${log.entity_id}` : '');
      return t('activity.default', { actor, target }).trim();
    }
  }
};

export const useProfileActivity = (
  activeTab: 'profile' | 'activity' | 'settings' | 'privacy',
  token: string | null,
  t: TranslateFn,
  showToast: (message: string) => void
) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (activeTab !== 'activity' || !token) {
      return;
    }

    setLoadingActivity(true);
    axios.get<ActivityLog[]>(`${API_URL}/activity/`, {
      headers: { Authorization: `Token ${token}` }
    })
      .then((res) => setActivityLogs(res.data))
      .catch(() => showToast(t('common.error')))
      .finally(() => setLoadingActivity(false));
  }, [activeTab, showToast, t, token]);

  const clearActivity = useCallback(async () => {
    if (!token) return;

    setLoadingActivity(true);
    try {
      await axios.post(
        `${API_URL}/activity/clear/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setActivityLogs([]);
      showToast(t('profile.activity.cleared'));
    } catch {
      showToast(t('common.error'));
    } finally {
      setLoadingActivity(false);
    }
  }, [showToast, t, token]);

  return {
    activityLogs,
    loadingActivity,
    clearActivity,
  };
};
