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
        navigate(`/boards/${board.id}`);
      } catch (err: any) {
        if (err.response?.data?.detail === 'already_member') {
            navigate('/boards');
            return;
        }

        console.error("Invite error:", err);
        setError(t('toast.inviteUnavailable'));
        setTimeout(() => navigate('/boards'), 3000);
      }
    };

    handleJoin();
  }, [link, navigate]);

  if (error) {
    return (
      <div className="loading-state" style={{ flexDirection: 'column', gap: 16 }}>
        <h3 style={{ color: 'var(--danger)' }}>{t('common.error')}</h3>
        <p>{error}</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('common.redirecting')}</p>
      </div>
    );
  }

  return (
    <div className="loading-state">
      <h3>{t('board.joining')}</h3>
    </div>
  );
};
