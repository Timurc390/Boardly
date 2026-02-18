import React, { useMemo, useState } from 'react';
import { Card } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { useI18n } from '../../../../context/I18nContext';

interface CardChecklistsProps {
  card: Card;
  canEdit: boolean;
  onDeleteChecklist: (checklistId: number) => Promise<any> | void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<any> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<any> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<any> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<any> | void;
}

export const CardChecklists: React.FC<CardChecklistsProps> = ({ 
  card, canEdit, onDeleteChecklist, onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem, onUpdateChecklistItem
}) => {
  const { t } = useI18n();
  const checklists = useMemo(() => card.checklists || [], [card.checklists]);
  const [expandedAddChecklistId, setExpandedAddChecklistId] = useState<number | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [hideCompleted, setHideCompleted] = useState<Record<number, boolean>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const commitEdit = async (itemId: number) => {
    const next = editingText.trim();
    if (!next) {
      setEditingItemId(null);
      return;
    }
    await onUpdateChecklistItem(itemId, next);
    setEditingItemId(null);
  };

  const submitNewChecklistItem = async (checklistId: number) => {
    const next = newItemText.trim();
    if (!next) return;
    await onAddChecklistItem(checklistId, next);
    setNewItemText('');
    setExpandedAddChecklistId(checklistId);
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    if (!canEdit) return;
    if (!window.confirm(t('checklist.deleteConfirm'))) return;
    await onDeleteChecklist(checklistId);
    if (expandedAddChecklistId === checklistId) {
      setExpandedAddChecklistId(null);
      setNewItemText('');
    }
  };

  return (
    <>
      {checklists.length ? (
        checklists.map(checklist => {
          const items = checklist.items || [];
          const totalCount = items.length;
          const doneCount = items.filter(item => item.is_checked).length;
          const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
          const showOnlyUnchecked = !!hideCompleted[checklist.id];
          const visibleItems = showOnlyUnchecked
            ? items.filter(item => !item.is_checked)
            : items;
          const isDoneOnlyHidden = showOnlyUnchecked && doneCount > 0 && visibleItems.length === 0;

          return (
            <div key={checklist.id} className="card-section checklist-block">
              <div className="checklist-top">
                <h4 className="card-main-section-title checklist-title">
                  <span className="card-main-section-icon">☑</span>
                  {checklist.title || t('checklist.title')}
                </h4>
                <div className="checklist-header-actions">
                  {doneCount > 0 && (
                    <button
                      type="button"
                      className="card-section-action"
                      onClick={() =>
                        setHideCompleted(prev => ({ ...prev, [checklist.id]: !prev[checklist.id] }))
                      }
                    >
                      {showOnlyUnchecked ? t('checklist.showCompleted') : t('checklist.hideCompleted')}
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      className="card-section-action checklist-delete"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>

              <div className="checklist-progress">
                <span className="checklist-progress-value">{progress}%</span>
                <div className="checklist-progress-track" role="progressbar">
                  <div className="checklist-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="checklist-items">
                {visibleItems.map(item => (
                  <div key={item.id} className="checklist-item">
                    <input 
                      type="checkbox" 
                      checked={item.is_checked} 
                      onChange={e => canEdit && onToggleChecklistItem(item.id, e.target.checked)}
                      disabled={!canEdit}
                    />
                    {editingItemId === item.id ? (
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => commitEdit(item.id)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') commitEdit(item.id);
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                      />
                    ) : (
                      <span
                        className="checklist-item-text"
                        onDoubleClick={() => {
                          if (!canEdit) return;
                          setEditingItemId(item.id);
                          setEditingText(item.text);
                        }}
                        data-checked={item.is_checked ? 'true' : 'false'}
                        data-editable={canEdit ? 'true' : 'false'}
                      >
                        {item.text}
                      </span>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        className="btn-icon checklist-item-delete"
                        onClick={() => onDeleteChecklistItem(item.id, checklist.id)}
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                {isDoneOnlyHidden && <div className="card-muted">{t('checklist.hiddenDoneOnly')}</div>}
              </div>
              {canEdit && (
                <div className="checklist-add-row">
                  {expandedAddChecklistId === checklist.id ? (
                    <>
                      <Input
                        autoFocus
                        placeholder={t('checklist.itemPlaceholder')}
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            void submitNewChecklistItem(checklist.id);
                          } else if (e.key === 'Escape') {
                            setExpandedAddChecklistId(null);
                            setNewItemText('');
                          }
                        }}
                      />
                      <div className="checklist-add-actions">
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => void submitNewChecklistItem(checklist.id)}
                        >
                          {t('common.add')}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => {
                            setExpandedAddChecklistId(null);
                            setNewItemText('');
                          }}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="checklist-add-trigger"
                      onClick={() => {
                        setExpandedAddChecklistId(checklist.id);
                        setNewItemText('');
                      }}
                    >
                      + {t('checklist.addItem')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="card-section">
          <h4 className="card-main-section-title">
            <span className="card-main-section-icon">☑</span>
            {t('checklist.title')}
          </h4>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('checklist.empty')}
          </div>
        </div>
      )}
    </>
  );
};
