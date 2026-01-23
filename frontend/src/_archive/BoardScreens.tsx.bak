import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Board } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export const BoardListScreen: React.FC = () => {
  const { authToken, user, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    if (authToken) fetchBoards();
  }, [authToken]);

  const fetchBoards = async () => {
    try {
      const res = await axios.get(`${API_URL}/boards/`, { headers: { Authorization: `Token ${authToken}` } });
      setBoards(res.data);
    } catch (e) { console.error(e); }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/boards/`, { title: newBoardTitle }, { headers: { Authorization: `Token ${authToken}` } });
      setNewBoardTitle(''); setShowCreate(false); fetchBoards();
    } catch (e) { alert('Помилка створення'); }
  };

  return (
    <div style={{minHeight: '100vh', background: 'var(--bg-main)'}}>
      <div className="nav-bar">
        <div style={{fontSize: '20px', fontWeight: 'bold', display:'flex', gap:'10px', alignItems:'center'}}>
            <span>📋</span> Boardly
        </div>
        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
            <span style={{color: 'var(--text-secondary)'}}>Привіт, {user?.first_name || user?.username}</span>
            <Link to="/profile" className="link">Профіль</Link>
            <button onClick={logout} className="btn-danger">Вийти</button>
        </div>
      </div>

      <div className="boards-grid">
        {boards.map(board => (
          <Link key={board.id} to={`/boards/${board.id}`} className="board-tile">
            <h3 style={{margin:0}}>{board.title}</h3>
            {board.description && <p style={{fontSize:'12px', margin:'8px 0 0', opacity:0.7}}>{board.description}</p>}
          </Link>
        ))}
        
        {showCreate ? (
          <form onSubmit={createBoard} className="board-tile" style={{border: '2px solid var(--accent-link)'}}>
            <input 
              autoFocus className="input" placeholder="Назва дошки..." value={newBoardTitle} 
              onChange={e => setNewBoardTitle(e.target.value)} style={{background:'transparent', padding: '4px'}}
            />
            <button type="submit" className="btn-primary" style={{padding:'6px', fontSize:'12px'}}>Створити</button>
          </form>
        ) : (
          <div onClick={() => setShowCreate(true)} className="board-tile create-board-tile"><span>+ Створити дошку</span></div>
        )}
      </div>
    </div>
  );
};

export const BoardDetailScreen: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { authToken } = useAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  useEffect(() => { if (boardId && authToken) fetchBoard(); }, [boardId, authToken]);

  const fetchBoard = async () => {
    try {
      const res = await axios.get(`${API_URL}/boards/${boardId}/`, { headers: { Authorization: `Token ${authToken}` } });
      setBoard(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;
    try {
      await axios.post(`${API_URL}/lists/`, { board: board.id, title: newListTitle, order: board.lists.length + 1 }, { headers: { Authorization: `Token ${authToken}` } });
      setNewListTitle(''); setAddingList(false); fetchBoard();
    } catch (e) { alert('Помилка створення списку'); }
  };

  const deleteList = async (listId: number) => {
    if (!window.confirm("Видалити список?")) return;
    try { await axios.delete(`${API_URL}/lists/${listId}/`, { headers: { Authorization: `Token ${authToken}` } }); fetchBoard(); } catch (e) { alert('Помилка'); }
  };

  const createCard = async (e: React.FormEvent, listId: number) => {
    e.preventDefault();
    try {
      const currentList = board?.lists.find(l => l.id === listId);
      const order = currentList ? currentList.cards.length + 1 : 1;
      await axios.post(`${API_URL}/cards/`, { list: listId, title: newCardTitle, order }, { headers: { Authorization: `Token ${authToken}` } });
      setNewCardTitle(''); setAddingCardToList(null); fetchBoard();
    } catch (e) { alert('Помилка створення картки'); }
  };

  const deleteCard = async (cardId: number) => {
    if (!window.confirm("Видалити картку?")) return;
    try { await axios.delete(`${API_URL}/cards/${cardId}/`, { headers: { Authorization: `Token ${authToken}` } }); fetchBoard(); } catch (e) { alert('Помилка'); }
  };

  if (loading) return <div style={{color:'white', padding:40}}>Завантаження...</div>;
  if (!board) return <div style={{color:'white', padding:40}}>Дошку не знайдено</div>;

  return (
    <div className="board-layout">
      <div className="board-header">
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <Link to="/" className="btn-secondary" style={{textDecoration:'none'}}>← Назад</Link>
            <h2 style={{margin:0, color:'white'}}>{board.title}</h2>
        </div>
      </div>

      <div className="board-canvas">
        {board.lists.sort((a,b) => a.order - b.order).map(list => (
          <div key={list.id} className="list-column">
            <div className="list-header">
                <span className="list-title">{list.title}</span>
                <button onClick={() => deleteList(list.id)} className="btn-icon">×</button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'8px', overflowY:'auto', flex:1}}>
                {list.cards.sort((a,b) => a.order - b.order).map(card => (
                    <div key={card.id} className="kanban-card">
                        <div style={{marginBottom:'4px'}}>{card.title}</div>
                        <div className="card-actions">
                            <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="btn-icon">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
            {addingCardToList === list.id ? (
                <form onSubmit={(e) => createCard(e, list.id)} style={{marginTop:'8px'}}>
                    <textarea className="input" autoFocus placeholder="Заголовок..." value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} style={{minHeight:'60px'}} />
                    <button type="submit" className="btn-primary" style={{padding:'6px 12px'}}>Додати</button>
                </form>
            ) : (
                <button onClick={() => setAddingCardToList(list.id)} className="add-card-btn">+ Додати картку</button>
            )}
          </div>
        ))}
        <div style={{minWidth: '280px'}}>
            {addingList ? (
                <form onSubmit={createList} className="list-column">
                    <input className="input" autoFocus placeholder="Назва списку..." value={newListTitle} onChange={e => setNewListTitle(e.target.value)} />
                    <button type="submit" className="btn-primary" style={{marginTop:8, padding:'8px'}}>Додати список</button>
                </form>
            ) : (
                <button onClick={() => setAddingList(true)} className="btn-secondary" style={{width:'100%', textAlign:'left'}}>+ Додати ще один список</button>
            )}
        </div>
      </div>
    </div>
  );
};