import React, { useState, useEffect } from 'react';
import { BoardCard } from './components/BoardCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useI18n } from '../../context/I18nContext';
import * as api from './api';
import { Board } from '../../types';

export const BoardListScreen: React.FC = () => {
  const { t } = useI18n();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const data = await api.getBoards();
        setBoards(data);
      } catch (error) {
        console.error("Failed to fetch boards", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const newBoard = await api.createBoard(newBoardTitle);
      setBoards(prev => [...prev, newBoard]);
      setNewBoardTitle('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(t('toast.boardCreateFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="loading-state">{t('common.loading')}</div>;
  }

  return (
    <div className="board-list-page">
      <div className="page-header">
        <h1>{t('nav.board')}</h1>
      </div>

      {boards.length === 0 && (
        <div className="empty-state" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600 }}>{t('board.empty.title')}</div>
          <div style={{ color: 'var(--text-secondary)' }}>{t('board.empty.subtitle')}</div>
        </div>
      )}

      <div className="boards-grid">
        {boards.map(board => (
          <BoardCard key={board.id} board={board} />
        ))}
        
        <button 
          className="board-card create-board-card" 
          onClick={() => setIsModalOpen(true)}
        >
          <span style={{ fontSize: '24px', lineHeight: 1 }}>+</span>
          <span>{t('common.create')}</span>
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('common.create')}
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
             <label className="form-label">{t('board.create.titleLabel')}</label>
             <Input 
                autoFocus
                placeholder={t('board.create.titleInputPlaceholder')}
                value={newBoardTitle}
                onChange={e => setNewBoardTitle(e.target.value)}
             />
          </div>
          <div className="modal-footer">
            <Button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="btn-primary" disabled={isCreating}>
              {isCreating ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
