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
        <div className="card-section-header">
          <h4 className="card-main-section-title">
            <span className="card-main-section-icon">☰</span>
            {t('card.descriptionTitle')}
          </h4>
          {!isEditing && canEdit && (
            <button type="button" className="card-section-action" onClick={() => setIsEditing(true)}>
              {t('common.edit')}
            </button>
          )}
        </div>
        {isEditing ? (
            <div className="card-description-editor">
                <textarea 
                    className="form-input card-description-textarea" 
                    rows={5} 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('card.descriptionPlaceholder')}
                />
                <div className="card-description-actions">
                    <Button size="sm" onClick={handleSave}>{t('common.save')}</Button>
                    <Button size="sm" className="btn-secondary" onClick={() => setIsEditing(false)}>{t('common.cancel')}</Button>
                </div>
            </div>
        ) : (
            <div 
                className={`card-desc-preview ${canEdit ? 'editable' : ''}`}
                onClick={() => canEdit && setIsEditing(true)}
            >
                {description || (canEdit ? t('card.descriptionPlaceholder') : t('card.descriptionEmpty'))}
            </div>
        )}
    </div>
  );
};
