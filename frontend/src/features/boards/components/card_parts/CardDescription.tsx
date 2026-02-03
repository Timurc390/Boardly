import React, { useState, useEffect } from 'react';
import { Card } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { useI18n } from '../../../../context/I18nContext';

interface CardDescriptionProps {
  card: Card;
  canEdit: boolean;
  onUpdateCard: (data: Partial<Card>) => void;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ card, canEdit, onUpdateCard }) => {
  const { t } = useI18n();
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
        <h4>{t('card.descriptionTitle')}</h4>
        {isEditing ? (
            <div>
                <textarea 
                    className="form-input" 
                    rows={5} 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('card.descriptionPlaceholder')}
                    style={{resize: 'vertical', width: '100%'}}
                />
                <div style={{marginTop: 8, display:'flex', gap:8}}>
                    <Button size="sm" onClick={handleSave}>{t('common.save')}</Button>
                    <Button size="sm" className="btn-secondary" onClick={() => setIsEditing(false)}>{t('common.cancel')}</Button>
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
                {description || (canEdit ? t('card.descriptionPlaceholder') : t('card.descriptionEmpty'))}
            </div>
        )}
    </div>
  );
};
