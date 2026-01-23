import React from 'react';
import { Link } from 'react-router-dom';
import { Board } from '../../../types';

interface BoardCardProps {
  board: Board;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  return (
    <Link to={`/boards/${board.id}`} className="board-card" style={{
      background: board.background_url || 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="board-card-overlay">
        <h3 className="board-card-title">{board.title}</h3>
        {board.is_favorite && <span className="board-star">★</span>}
      </div>
    </Link>
  );
};