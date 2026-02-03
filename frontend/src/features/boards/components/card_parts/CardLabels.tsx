import React, { useState } from 'react';
import { Card, Board } from '../../../../types';
import { useI18n } from '../../../../context/I18nContext';

interface CardLabelsProps {
  card: Card;
  board: Board;
  canEdit: boolean;
  onUpdateLabels: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => void;
  onUpdateLabel: (id: number, name: string, color: string) => void;
  onDeleteLabel: (id: number) => void;
  startEditingDueDate: () => void;
  isOverdue: boolean;
  overdueText: string | null;
}

export const CardLabels: React.FC<CardLabelsProps> = ({ 
  card, board, canEdit, onUpdateLabels, onCreateLabel, 
  onUpdateLabel, onDeleteLabel,
  startEditingDueDate, isOverdue, overdueText
}) => {
  const { t, locale } = useI18n();
  
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#000000');

  const handleLabelToggle = (labelId: number) => {
    if (!canEdit) return;
    const currentIds = card.labels ? card.labels.map(l => l.id) : [];
    const newIds = currentIds.includes(labelId) 
      ? currentIds.filter(id => id !== labelId)
      : [...currentIds, labelId];
    onUpdateLabels(newIds);
  };

  const startEditing = (e: React.MouseEvent, label: {id: number, name: string, color: string}) => {
      e.stopPropagation();
      setEditingLabelId(label.id);
      setEditName(label.name);
      setEditColor(label.color);
  };

  const saveLabel = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingLabelId && editName.trim()) {
          onUpdateLabel(editingLabelId, editName, editColor);
          setEditingLabelId(null);
      }
  };

  const deleteLabel = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      onDeleteLabel(id);
      setEditingLabelId(null);
  };

  const dueDate = card.due_date ? new Date(card.due_date) : null;
  const dueText = dueDate && !Number.isNaN(dueDate.getTime())
    ? dueDate.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const dueClass = [
    'card-due-badge',
    card.is_completed ? 'completed' : isOverdue ? 'overdue' : ''
  ].filter(Boolean).join(' ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16 }}>
        <div className="card-section" style={{ minWidth: 240, maxWidth: 320 }}>
            <h4>{t('labels.title')}</h4>
            <div className="card-labels-list" style={{ flexDirection: 'column', gap: 8 }}>
                
                {board.labels?.map(label => {
                    const isChecked = card.labels?.some(l => l.id === label.id);
                    const isEditing = editingLabelId === label.id;

                    if (isEditing) {
                        return (
                            <div key={label.id} style={{display:'flex', gap:4, alignItems:'center', marginBottom:4, padding:4, background:'rgba(255,255,255,0.05)', borderRadius:4}} onClick={e => e.stopPropagation()}>
                                <input 
                                    type="color" 
                                    value={editColor} 
                                    onChange={e => setEditColor(e.target.value)}
                                    style={{width:24, height:24, border:'none', background:'none', padding:0, cursor:'pointer'}}
                                />
                                <input 
                                    className="form-input" 
                                    style={{padding: '4px 8px', fontSize:12, height:28}}
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                                <button className="btn-icon" onClick={saveLabel} style={{color:'var(--success)', fontSize:14}}>✓</button>
                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setEditingLabelId(null); }} style={{fontSize:14}}>✕</button>
                            </div>
                        );
                    }

                    return (
                        <div 
                            key={label.id} 
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: canEdit ? 'pointer' : 'default', padding: '4px 0' }}
                            onClick={() => canEdit && handleLabelToggle(label.id)}
                        >
                            <input 
                                type="checkbox" 
                                checked={isChecked || false} 
                                onChange={() => {}} 
                                disabled={!canEdit}
                                style={{ width: 16, height: 16, cursor: canEdit ? 'pointer' : 'not-allowed', accentColor: 'var(--primary-blue)' }}
                            />
                            <div 
                                className="label-chip" 
                                style={{ background: label.color, flex: 1, margin: 0, opacity: isChecked ? 1 : 0.6, textAlign: 'left', minHeight: '24px', display: 'flex', alignItems: 'center' }}
                            >
                                {label.name}
                            </div>
                            
                            {canEdit && (
                                <div style={{display:'flex', gap:0}}>
                                    <button 
                                        className="btn-icon" 
                                        style={{width:24, height:24, fontSize:12, opacity:0.5}}
                                        title={t('common.edit')}
                                        onClick={(e) => startEditing(e, label)}
                                    >
                                        ✎
                                    </button>
                                    <button 
                                        className="btn-icon" 
                                        style={{width:24, height:24, fontSize:12, opacity:0.5, color: 'var(--danger)'}}
                                        title={t('common.delete')}
                                        onClick={(e) => deleteLabel(e, label.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {canEdit && (
                    <div style={{marginTop: 8}}>
                        <button type="button" className="label-create-btn" style={{
                            background: 'transparent', border: '1px dashed var(--text-secondary)', color: 'var(--text-secondary)',
                            width: '100%', padding: '6px', borderRadius: 4, cursor: 'pointer', fontSize: 12
                        }} onClick={(e) => {
                            e.stopPropagation();
                            const name = prompt(t('labels.newPrompt'));
                            if(name) onCreateLabel(name, '#'+Math.floor(Math.random()*16777215).toString(16));
                        }}>{`+ ${t('labels.add')}`}</button>
                    </div>
                )}
            </div>
        </div>

        {card.due_date && (
            <div className="card-section">
                <h4>{t('card.dueDate')}</h4>
                <div onClick={canEdit ? startEditingDueDate : undefined}
                    style={{
                        cursor: canEdit ? 'pointer' : 'default',
                        display: 'inline-flex', alignItems: 'center', gap: 8
                    }}
                    className={dueClass}
                >
                    <span>{dueText}</span>
                    {overdueText && <span style={{fontWeight: 'bold'}}>{overdueText}</span>}
                    {card.is_completed && <span style={{fontSize: 11, fontWeight: 'bold'}}>{t('card.completedBadge')}</span>}
                </div>
            </div>
        )}
    </div>
  );
};
