import React from 'react';
import { Link } from 'react-router-dom';
import { Board } from '../../../types';

interface BoardCardProps {
  board: Board;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const style: React.CSSProperties = {};
  const defaultBoardBackground = '/board-backgrounds/board-default.jpg';
  
  if (board.background_url) {
    if (board.background_url.startsWith('#')) {
      style.backgroundColor = board.background_url;
    } else if (board.background_url.startsWith('linear-gradient') || board.background_url.startsWith('radial-gradient')) {
      style.backgroundImage = board.background_url;
    } else {
      style.backgroundImage = `url(${board.background_url})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }
  } else {
    style.backgroundImage = `url(${defaultBoardBackground})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }

  return (
    <Link to={`/boards/${board.id}`} className="board-card" style={style}>
      <div className="board-card-overlay">
        <span className="board-card-title">{board.title}</span>
        {board.is_favorite && <span style={{ position: 'absolute', top: 10, right: 10, color: '#FFC107' }}>★</span>}
      </div>
    </Link>
  );
};
