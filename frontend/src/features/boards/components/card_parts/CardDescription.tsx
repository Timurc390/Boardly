import React, { useState, useEffect } from 'react';
import { Card } from '../../../../types';
import { Button } from '../../../../components/ui/Button';

interface CardDescriptionProps {
  card: Card;
  canEdit: boolean;
  onUpdateCard: (data: Partial<Card>) => void;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ card, canEdit, onUpdateCard }) => {
  const [description, setDescription] = useState(card.description || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDescription(card.description || '');
  }, [card.description]);

  const handleSave = () => {
    if (!canEdit) return;
    onUpdateCard({ description });
    setIsEditing(false);
  };

  return (
    <div className="card-section">
        <h4>Опис</h4>
        {isEditing ? (
            <div>
                <textarea 
                    className="form-input" 
                    rows={5} 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Додайте детальний опис..."
                    style={{resize: 'vertical', width: '100%'}}
                />
                <div style={{marginTop: 8, display:'flex', gap:8}}>
                    <Button size="sm" onClick={handleSave}>Зберегти</Button>
                    <Button size="sm" className="btn-secondary" onClick={() => setIsEditing(false)}>Скасувати</Button>
                </div>
            </div>
        ) : (
            <div 
                className="card-desc-preview" 
                onClick={() => canEdit && setIsEditing(true)}
                style={{
                    cursor: canEdit ? 'pointer' : 'default',
                    opacity: canEdit || description ? 1 : 0.5 
                }}
            >
                {description || (canEdit ? "Додати детальний опис..." : "Опис відсутній.")}
            </div>
        )}
    </div>
  );
};