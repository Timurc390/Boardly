import React, { useMemo, useState } from 'react';
import { Board, Card } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { useI18n } from '../../../../context/I18nContext';

interface CardChecklistsProps {
  board: Board;
  card: Card;
  canEdit: boolean;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<any> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<any> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<any> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<any> | void;
}

export const CardChecklists: React.FC<CardChecklistsProps> = ({ 
  board, card, canEdit, onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem, onUpdateChecklistItem
}) => {
  const { t } = useI18n();
  const checklist = card.checklists?.[0];
  const [sourceCardId, setSourceCardId] = useState<number | ''>('');
  const [copyMode, setCopyMode] = useState<'append' | 'replace'>('append');
  const [isCopying, setIsCopying] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const cardOptions = useMemo(() => {
    const allCards = board.lists?.flatMap(l => l.cards || []) || [];
    return allCards.filter(c => c.id !== card.id);
  }, [board.lists, card.id]);

  const handleCopyItems = async () => {
    if (!checklist || !sourceCardId) return;
    const sourceCard = cardOptions.find(c => c.id === sourceCardId);
    const sourceChecklist = sourceCard?.checklists?.[0];
    if (!sourceChecklist || !sourceChecklist.items?.length) return;

    setIsCopying(true);
    try {
      if (copyMode === 'replace' && checklist.items?.length) {
        for (const item of [...checklist.items]) {
          await onDeleteChecklistItem(item.id, checklist.id);
        }
      }
      for (const item of sourceChecklist.items) {
        await onAddChecklistItem(checklist.id, item.text);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const commitEdit = async (itemId: number) => {
    const next = editingText.trim();
    if (!next) {
      setEditingItemId(null);
      return;
    }
    await onUpdateChecklistItem(itemId, next);
    setEditingItemId(null);
  };

  return (
    <>
      {canEdit && checklist && (
        <div className="card-section">
          <h4>{t('checklist.copy.title')}</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-input"
              value={sourceCardId}
              onChange={(e) => setSourceCardId(e.target.value ? Number(e.target.value) : '')}
              style={{ minWidth: 220 }}
            >
              <option value="">{t('checklist.copy.selectCard')}</option>
              {cardOptions.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <select
              className="form-input"
              value={copyMode}
              onChange={(e) => setCopyMode(e.target.value as 'append' | 'replace')}
              style={{ minWidth: 180 }}
            >
              <option value="append">{t('checklist.copy.append')}</option>
              <option value="replace">{t('checklist.copy.replace')}</option>
            </select>
            <button type="button" className="btn-primary" onClick={handleCopyItems} disabled={!sourceCardId || isCopying}>
              {isCopying ? t('common.copying') : t('common.copy')}
            </button>
          </div>
        </div>
      )}
      {checklist ? (
          <div key={checklist.id} className="card-section">
              <div style={{display:'flex', justifyContent:'space-between', marginBottom: 8}}>
                  <h4>☑ {checklist.title || t('checklist.title')}</h4>
              </div>
              <div className="checklist-items">
                  {checklist.items?.map(item => (
                      <div key={item.id} className="checklist-item" style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4}}>
                          <input 
                              type="checkbox" 
                              checked={item.is_checked} 
                              onChange={e => canEdit && onToggleChecklistItem(item.id, e.target.checked)}
                              disabled={!canEdit}
                              style={{width: 16, height: 16, cursor: canEdit ? 'pointer' : 'not-allowed'}}
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
                              onDoubleClick={() => {
                                if (!canEdit) return;
                                setEditingItemId(item.id);
                                setEditingText(item.text);
                              }}
                              style={{
                                textDecoration: item.is_checked ? 'line-through' : 'none',
                                color: item.is_checked ? 'var(--text-secondary)' : 'var(--text-primary)',
                                cursor: canEdit ? 'text' : 'default'
                              }}
                            >
                              {item.text}
                            </span>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => onDeleteChecklistItem(item.id, checklist.id)}
                              title={t('common.delete')}
                              style={{ marginLeft: 'auto' }}
                            >
                              🗑️
                            </button>
                          )}
                      </div>
                  ))}
              </div>
              {canEdit && (
                  <div style={{marginTop: 8}}>
                      <Input 
                          placeholder={t('checklist.itemPlaceholder')}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if(e.key === 'Enter') {
                                  onAddChecklistItem(checklist.id, e.currentTarget.value);
                                  e.currentTarget.value = '';
                              }
                          }}
                      />
                  </div>
              )}
          </div>
      ) : (
        <div className="card-section">
          <h4>{t('checklist.title')}</h4>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('checklist.empty')}
          </div>
        </div>
      )}
    </>
  );
};
