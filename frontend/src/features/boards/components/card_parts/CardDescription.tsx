import React, { useState, useEffect, useMemo } from 'react';
import { FiAlignLeft } from 'shared/ui/fiIcons';
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
  const [hasDraft, setHasDraft] = useState(false);
  const draftKey = useMemo(() => `boardly.card.${card.id}.description.draft`, [card.id]);

  useEffect(() => {
    setDescription(card.description || '');
  }, [card.description]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const draft = window.localStorage.getItem(draftKey);
    setHasDraft(Boolean(draft && draft !== (card.description || '')));
  }, [card.description, draftKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isEditing) return;
    window.localStorage.setItem(draftKey, description);
    setHasDraft(Boolean(description && description !== (card.description || '')));
  }, [card.description, description, draftKey, isEditing]);

  const handleSave = () => {
    if (!canEdit) return;
    onUpdateCard({ description });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftKey);
    }
    setHasDraft(false);
    setIsEditing(false);
  };

  const handleRestoreDraft = () => {
    if (typeof window === 'undefined') return;
    const draft = window.localStorage.getItem(draftKey);
    if (!draft) return;
    setDescription(draft);
    setIsEditing(true);
  };

  const handleClearDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftKey);
    }
    setHasDraft(false);
  };

  return (
    <div className="card-section">
        <div className="card-section-header">
          <h4 className="card-main-section-title">
            <span className="card-main-section-icon"><FiAlignLeft aria-hidden="true" /></span>
            {t('card.descriptionTitle')}
          </h4>
          {!isEditing && canEdit && (
            <button type="button" className="card-section-action" onClick={() => setIsEditing(true)}>
              {t('common.edit')}
            </button>
          )}
        </div>
        {!isEditing && hasDraft && canEdit && (
          <div className="card-description-draft-banner">
            <span>{t('card.description.draftFound')}</span>
            <div className="card-description-draft-actions">
              <button type="button" className="card-section-action" onClick={handleRestoreDraft}>
                {t('card.description.restoreDraft')}
              </button>
              <button type="button" className="card-section-action" onClick={handleClearDraft}>
                {t('card.description.clearDraft')}
              </button>
            </div>
          </div>
        )}
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
