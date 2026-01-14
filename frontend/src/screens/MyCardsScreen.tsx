import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface BoardInfo {
  id: number;
  title: string;
  is_archived?: boolean;
}

interface ListInfo {
  id: number;
  title: string;
}

interface Card {
  id: number;
  title: string;
  description?: string;
  list: ListInfo;
  board: BoardInfo;
  due_date?: string | null;
  is_archived?: boolean;
  labels?: Array<{ id: number; name: string; color: string }>;
}

interface MyCard extends Card {
  boardId: number;
  boardTitle: string;
}

export const MyCardsScreen: React.FC = () => {
  const { authToken, user, isAuthenticated, boardCache, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [cards, setCards] = useState<MyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCards = async () => {
    if (!authToken || !user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/my-cards/`, { headers: { Authorization: `Token ${authToken}` } });
      const assigned = (res.data as Card[]).map(card => ({
        ...card,
        boardId: card.board?.id || 0,
        boardTitle: card.board?.title || 'Дошка'
      }));

      setCards(assigned);
      if (assigned.length === 0) {
        setInfo('Поки що немає карток, де ви призначені.');
      } else {
        setInfo(null);
      }
    } catch {
      setError('Не вдалося завантажити картки. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadCards();
  }, [authToken, user]);

  const grouped = useMemo(() => {
    const map = new Map<number, { boardTitle: string; items: MyCard[] }>();
    cards.forEach(card => {
      if (!map.has(card.boardId)) {
        map.set(card.boardId, { boardTitle: card.boardTitle, items: [] });
      }
      map.get(card.boardId)?.items.push(card);
    });
    return Array.from(map.values());
  }, [cards]);

  if (!isAuthenticated || !user) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="page-state">
          <div className="page-state-title">Завантаження карток...</div>
        </div>
      </div>
    );
  }

  const closeMobileNav = () => setShowMobileNav(false);

  return (
    <div className="app-container">
      <nav className="top-nav">
        <Link to="/board" className="nav-logo" onClick={closeMobileNav}>Boardly</Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label="Меню"
        >
          Меню
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          <Link to="/board" className="link" onClick={closeMobileNav}>Дошка</Link>
          <Link to="/my-cards" className="link" onClick={closeMobileNav}>Мої картки</Link>
          <Link to="/profile" className="link" onClick={closeMobileNav}>Профіль</Link>
          <Link to="/faq" className="link" onClick={closeMobileNav}>FAQ</Link>
          {user && <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user.first_name || user.username}</span>}
          <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{ color: 'var(--accent-danger)' }}>Вийти</button>
        </div>
      </nav>
      <div className="mycards-page">
        <div className="mycards-header">
          <h2>Мої картки</h2>
        </div>
        {info && <p className="mycards-info">{info}</p>}
        {error && (
          <div className="mycards-error">
            <p className="mycards-error-text">{error}</p>
            <button className="board-btn primary" onClick={loadCards}>Повторити</button>
          </div>
        )}
        {grouped.map(group => (
          <div key={group.boardTitle} className="mycards-section">
            <h3 className="mycards-section-title">{group.boardTitle}</h3>
            <div className="mycards-grid">
              {group.items.map(card => (
                <div
                  key={card.id}
                  className="task-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!card.board?.id || card.board?.is_archived) {
                      setInfo('Дошка недоступна.');
                      return;
                    }
                    if (boardCache && !boardCache.some(board => board.id === card.board.id)) {
                      setInfo('Дошка недоступна.');
                      return;
                    }
                    navigate(`/board?board=${card.boardId}&card=${card.id}`);
                  }}
                >
                  <div className="task-title">{card.title}</div>
                  {card.description && <div className="task-desc">{card.description}</div>}
                  {card.board?.is_archived && (
                    <div className="toolbar-meta">Дошка в архіві</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && !info && !error && (
          <p className="mycards-info">Поки що немає карток у списку.</p>
        )}
      </div>
    </div>
  );
};
