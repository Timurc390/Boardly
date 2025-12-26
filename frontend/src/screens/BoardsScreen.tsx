import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

type Board = { id: number; title: string; description?: string };

export const BoardsScreen: React.FC = () => {
  const { authToken } = useAuth();
  const headers = authToken ? { Authorization: `Token ${authToken}` } : {};
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/boards/`, { headers }).then(res => setBoards(res.data));
  }, [authToken]);

  const addBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/boards/`, { title: newBoardTitle }, { headers });
      setBoards([...boards, res.data]);
      setNewBoardTitle('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ background: '#eef2f6', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0b2744', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span role="img" aria-label="boards">🗂️</span> Дошки
            </div>
            <div style={{ color: '#5a6b7b', marginTop: 6 }}>Створюй та організовуй свої проєкти.</div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            padding: 16,
            borderRadius: 10,
            boxShadow: '0 6px 16px rgba(15, 23, 32, 0.08)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <input
            value={newBoardTitle}
            onChange={e => setNewBoardTitle(e.target.value)}
            placeholder="Нова дошка"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d0d7de',
              fontSize: 14,
            }}
          />
          <button
            onClick={addBoard}
            disabled={creating}
            style={{
              background: '#026AA7',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Створюємо…' : 'Створити'}
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {boards.map(b => (
            <Link
              key={b.id}
              to={`/boards/${b.id}`}
              style={{
                padding: 16,
                borderRadius: 10,
                background: 'white',
                boxShadow: '0 4px 12px rgba(15, 23, 32, 0.06)',
                textDecoration: 'none',
                color: '#172B4D',
                border: '1px solid #e1e6eb',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{b.title}</div>
              <div style={{ fontSize: 13, color: '#5a6b7b' }}>{b.description || 'Без опису'}</div>
            </Link>
          ))}
          {boards.length === 0 && (
            <div style={{ color: '#5a6b7b', padding: 8 }}>Поки що немає жодної дошки. Створіть першу!</div>
          )}
        </div>
      </div>
    </div>
  );
};
