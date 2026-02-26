import React from 'react';
import { type ArchivedSectionProps } from './types';

export const ArchivedSection: React.FC<ArchivedSectionProps> = ({
  t,
  board,
  archivedLists,
  archivedCards,
  onUnarchiveList,
  onDeleteList,
  onUnarchiveCard,
  onDeleteCard,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4 className="menu-section-title">{t('archive.lists')}</h4>
        {archivedLists.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('list.empty.noneTitle')}</div>
        )}
        {archivedLists.map((list) => (
          <div key={list.id} className="archived-item">
            <div className="archived-title">{list.title}</div>
            <div className="archived-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => onUnarchiveList(list.id)}>
                {t('list.unarchive')}
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={() => onDeleteList(list.id)}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="menu-section-title">{t('archive.cards')}</h4>
        {archivedCards.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('card.empty')}</div>
        )}
        {archivedCards.map((card) => (
          <div key={card.id} className="archived-item">
            <div className="archived-title">
              {card.title}
              <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginLeft: 6 }}>
                {board.lists?.find((list) => list.id === card.list)?.title}
              </span>
            </div>
            <div className="archived-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => onUnarchiveCard(card.id)}>
                {t('card.unarchive')}
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={() => onDeleteCard(card.id)}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
