import React, { useState } from 'react';
import { useBoards } from './hooks/useBoards';
import { BoardCard } from './components/BoardCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useI18n } from '../../context/I18nContext';

export const BoardListScreen: React.FC = () => {
  const { boards, isLoading, addBoard } = useBoards();
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    
    setIsCreating(true);
    try {
      await addBoard(newBoardTitle);
      setNewBoardTitle('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      // Тут можна додати toast notification
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

      <div className="boards-grid">
        {boards.map(board => (
          <BoardCard key={board.id} board={board} />
        ))}
        
        {/* Кнопка створення як картка */}
        <button 
          className="board-card create-board-card" 
          onClick={() => setIsModalOpen(true)}
        >
          <span>+ {t('common.create')}</span>
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('common.create')}
      >
        <form onSubmit={handleCreate}>
          <Input 
            autoFocus
            placeholder="Назва дошки" 
            value={newBoardTitle}
            onChange={e => setNewBoardTitle(e.target.value)}
          />
          <div className="modal-actions" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={isCreating}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};