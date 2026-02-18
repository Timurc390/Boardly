import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import client from '../api/client';
import { Label } from '../types';

interface MyCard {
  id: number;
  title: string;
  description?: string;
  card_color?: string;
  due_date?: string | null;
  is_archived?: boolean;
  is_public?: boolean;
  board: { id: number; title: string };
  list: { id: number; title: string };
  labels?: Label[];
}

export const MyCardsScreen: React.FC = () => {
  const { t, locale } = useI18n();
  const [cards, setCards] = useState<MyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyCards = async () => {
      try {
        setIsLoading(true);
        const res = await client.get('/my-cards/');
        setCards(res.data);
      } catch {
        setError(t('myCards.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyCards();
  }, [t]);

  return (
    <div style={{
      padding: '32px',
      paddingTop: 'calc(32px + env(safe-area-inset-top))',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
      color: 'var(--text-primary)'
    }}>
      <h1 style={{ marginBottom: 16 }}>{t('nav.myCards')}</h1>

      {isLoading && <div className="loading-state">{t('myCards.loading')}</div>}
      {error && <div className="error-state">{error}</div>}

      {!isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.length === 0 && (
            <div style={{ color: 'var(--text-secondary)' }}>{t('myCards.emptyAssigned')}</div>
          )}
          {cards.map(card => (
            <Link
              key={card.id}
              to={`/boards/${card.board.id}`}
              className="task-card"
              style={{ textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {card.board.title} • {card.list.title}
                  </div>
                </div>
                {card.due_date && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(card.due_date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
