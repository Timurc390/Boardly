import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinBoard } from './api';
import { useI18n } from '../../context/I18nContext';

export const InviteScreen: React.FC = () => {
  const { link } = useParams<{ link: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!link) {
      navigate('/boards');
      return;
    }

    const handleJoin = async () => {
      try {
        const board = await joinBoard(link);
        // Якщо успішно - переходимо на дошку
        navigate(`/boards/${board.id}`);
      } catch (err: any) {
        console.error(err);
        // Якщо помилка (наприклад, посилання недійсне)
        setError('Не вдалося приєднатися. Посилання недійсне або ви вже є учасником.');
        // Через 3 секунди перенаправляємо на список дошок
        setTimeout(() => navigate('/boards'), 3000);
      }
    };

    handleJoin();
  }, [link, navigate]);

  if (error) {
    return (
      <div className="loading-state" style={{ flexDirection: 'column', gap: 16 }}>
        <h3 style={{ color: 'var(--danger)' }}>Помилка</h3>
        <p>{error}</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Перенаправлення на головну...</p>
      </div>
    );
  }

  return (
    <div className="loading-state">
      <h3>Приєднання до дошки...</h3>
    </div>
  );
};