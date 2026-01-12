import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = '/api';

interface Board {
  id: number;
  title: string;
  description?: string;
}

interface List {
  id: number;
  title: string;
  board: number;
  order: number;
}

interface Card {
  id: number;
  title: string;
  description: string;
  list: number;
}

export const LegacyAppScreen: React.FC = () => {
  const { authToken, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToListId, setAddingToListId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authToken && !activeBoard) {
      axios.get(`${API_URL}/boards/`, { headers: { Authorization: `Token ${authToken}` } })
        .then(async (res) => {
          if (res.data.length > 0) {
            setActiveBoard(res.data[0]);
          } else {
            try {
              const newBoard = await axios.post(
                `${API_URL}/boards/`,
                { title: 'My First Board' },
                { headers: { Authorization: `Token ${authToken}` } }
              );
              setActiveBoard(newBoard.data);

              const boardId = newBoard.data.id;
              await Promise.all([
                axios.post(`${API_URL}/lists/`, { title: 'To Do', board: boardId, order: 0 }, { headers: { Authorization: `Token ${authToken}` } }),
                axios.post(`${API_URL}/lists/`, { title: 'In Progress', board: boardId, order: 1 }, { headers: { Authorization: `Token ${authToken}` } }),
                axios.post(`${API_URL}/lists/`, { title: 'Done', board: boardId, order: 2 }, { headers: { Authorization: `Token ${authToken}` } })
              ]);
            } catch (err: any) {
              setError(`Помилка створення дошки: ${err.message || 'Невідома помилка'}`);
            }
          }
        })
        .catch((err: any) => {
          setError(`Помилка завантаження дошок: ${err.response?.status} ${err.response?.statusText || err.message}`);
        });
    }
  }, [authToken, activeBoard]);

  useEffect(() => {
    if (authToken && activeBoard) {
      axios.get(`${API_URL}/lists/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
        .then(res => setLists(res.data.sort((a: List, b: List) => a.order - b.order)))
        .catch((err: any) => setError(`Помилка списків: ${err.message}`));

      axios.get(`${API_URL}/cards/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
        .then(res => setCards(res.data))
        .catch((err: any) => setError(`Помилка карток: ${err.message}`));
    }
  }, [authToken, activeBoard]);

  const handleAddTask = async (e: FormEvent, listId: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !authToken) return;
    try {
      const res = await axios.post(
        `${API_URL}/cards/`,
        { title: newTaskTitle, list: listId },
        { headers: { Authorization: `Token ${authToken}` } }
      );
      setCards([...cards, res.data]);
      setNewTaskTitle('');
      setAddingToListId(null);
    } catch (err: any) {
      alert(`Помилка створення задачі: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  };

  const handleMoveCard = async (card: Card, targetListId: number) => {
    try {
      const updatedCards = cards.map(c => c.id === card.id ? { ...c, list: targetListId } : c);
      setCards(updatedCards);

      await axios.patch(
        `${API_URL}/cards/${card.id}/`,
        { list: targetListId },
        { headers: { Authorization: `Token ${authToken}` } }
      );
    } catch (err: any) {
      alert(`Помилка переміщення: ${JSON.stringify(err.response?.data || err.message)}`);
      if (activeBoard) {
        axios.get(`${API_URL}/cards/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
          .then(res => setCards(res.data));
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Видалити задачу?")) return;
    try {
      setCards(cards.filter(c => c.id !== id));
      await axios.delete(`${API_URL}/cards/${id}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch {
      alert('Помилка видалення');
    }
  };

  if (!isAuthenticated || !user) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Завантаження...</div>;
  }

  if (error) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', flexDirection: 'column'}}>
        <h2 style={{color: 'var(--accent-danger)'}}>Виникла помилка</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()} style={{width: 'auto'}}>Спробувати ще раз</button>
      </div>
    );
  }

  if (!activeBoard) {
    return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Створення вашої дошки...</div>;
  }

  return (
    <div className="app-container">
      <nav className="top-nav">
        <Link to="/board" className="nav-logo">Boardly / {activeBoard.title}</Link>
        <div className="nav-actions">
          <span style={{fontSize: 14, color: 'var(--text-secondary)'}}>Привіт, {user.first_name || user.username}</span>
          <Link to="/profile" className="link">Профіль</Link>
          <button onClick={logout} className="link" style={{color: 'var(--accent-danger)'}}>Вийти</button>
        </div>
      </nav>

      <div className="board-layout">
        {lists.map((list, index) => (
          <div key={list.id} className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <div className={`dot col-${index % 3}`}></div>
                {list.title}
              </div>
              <span className="count-badge">{cards.filter(c => c.list === list.id).length}</span>
            </div>

            <div className="task-list">
              {cards.filter(c => c.list === list.id).map(card => (
                <div key={card.id} className="task-card">
                  <div className="task-title">{card.title}</div>
                  {card.description && <div className="task-desc">{card.description}</div>}

                  <div className="task-footer">
                    <div className="task-controls">
                      {lists.filter(l => l.id !== list.id).map(targetList => (
                        <button key={targetList.id} onClick={() => handleMoveCard(card, targetList.id)} className="move-btn">
                          → {targetList.title}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => handleDelete(card.id)} className="btn-icon danger">×</button>
                  </div>
                </div>
              ))}

              {addingToListId === list.id ? (
                <form onSubmit={(e) => handleAddTask(e, list.id)} style={{marginTop: 12}}>
                  <input autoFocus className="input" style={{marginBottom: 8}} placeholder="Назва задачі..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                  <div style={{display:'flex', gap: 8}}>
                    <button type="submit" className="btn-primary" style={{padding: '8px 12px', fontSize: 13}}>Додати</button>
                    <button type="button" onClick={() => { setAddingToListId(null); setNewTaskTitle(''); }} className="link">Скасувати</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => { setAddingToListId(list.id); setNewTaskTitle(''); }} className="btn-primary" style={{background: 'transparent', border: '1px dashed var(--bg-input)', color: 'var(--text-muted)', marginTop: 12}}>+ Нова задача</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
