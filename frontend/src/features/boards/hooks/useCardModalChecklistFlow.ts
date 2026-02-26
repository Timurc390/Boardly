import { useCallback, useState } from 'react';
import { type Card } from '../../../types';

type ChecklistEntity = { id?: number } | null | void;

type UseCardModalChecklistFlowParams = {
  card: Card;
  onAddChecklist: (title: string) => Promise<ChecklistEntity> | ChecklistEntity;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<unknown> | unknown;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<unknown> | unknown;
  setActivePopover: (value: 'labels' | 'members' | 'attachments' | 'checklist' | 'dueDate' | null) => void;
  scrollToChecklists: () => void;
  defaultChecklistTitle: string;
};

export const useCardModalChecklistFlow = ({
  card,
  onAddChecklist,
  onAddChecklistItem,
  onToggleChecklistItem,
  setActivePopover,
  scrollToChecklists,
  defaultChecklistTitle,
}: UseCardModalChecklistFlowParams) => {
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [checklistCopyFromId, setChecklistCopyFromId] = useState<number | null>(null);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);

  const handleCreateChecklist = useCallback(async () => {
    if (isCreatingChecklist) return;

    const title = newChecklistTitle.trim() || defaultChecklistTitle;
    setIsCreatingChecklist(true);

    try {
      const created = await onAddChecklist(title);
      const createdId = typeof created === 'object' && created && 'id' in created ? Number(created.id) : NaN;
      if (!Number.isFinite(createdId)) return;

      if (checklistCopyFromId) {
        const sourceChecklist = (card.checklists || []).find((checklist) => checklist.id === checklistCopyFromId);
        if (sourceChecklist?.items?.length) {
          for (const sourceItem of sourceChecklist.items) {
            const text = sourceItem.text?.trim();
            if (!text) continue;

            const createdItem = await onAddChecklistItem(createdId, text);
            const createdItemId = typeof createdItem === 'object' && createdItem && 'id' in createdItem
              ? Number((createdItem as { id?: number }).id)
              : NaN;

            if (sourceItem.is_checked && Number.isFinite(createdItemId)) {
              await onToggleChecklistItem(createdItemId, true);
            }
          }
        }
      }

      setActivePopover(null);
      setNewChecklistTitle('');
      setChecklistCopyFromId(null);
      window.setTimeout(() => scrollToChecklists(), 0);
    } finally {
      setIsCreatingChecklist(false);
    }
  }, [
    card.checklists,
    checklistCopyFromId,
    defaultChecklistTitle,
    isCreatingChecklist,
    newChecklistTitle,
    onAddChecklist,
    onAddChecklistItem,
    onToggleChecklistItem,
    scrollToChecklists,
    setActivePopover,
  ]);

  return {
    newChecklistTitle,
    setNewChecklistTitle,
    checklistCopyFromId,
    setChecklistCopyFromId,
    isCreatingChecklist,
    handleCreateChecklist,
  };
};
