import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, User } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

type Member = {
  id: number;
  user: User;
  role: 'admin' | 'member';
  board: number;
};

type Props = {
  boardId: number;
  isAdmin: boolean;
};

export const BoardMembers: React.FC<Props> = ({ boardId, isAdmin }) => {
  const { authToken } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [newUserId, setNewUserId] = useState('');

  const authHeaders = authToken ? { Authorization: `Token ${authToken}` } : {};

  useEffect(() => {
    if (!authToken) return;
    axios
      .get<Member[]>(`${API_URL}/board-members/?board_id=${boardId}`, { headers: authHeaders })
      .then(res => setMembers(res.data))
      .catch(console.error);
  }, [boardId, authToken]);

  const changeRole = async (id: number, role: 'admin' | 'member') => {
    await axios.patch(`${API_URL}/board-members/${id}/`, { role }, { headers: authHeaders });
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, role } : m)));
  };

  const addMember = async () => {
    if (!newUserId) return;
    const res = await axios.post<Member>(
      `${API_URL}/board-members/`,
      { user_id: Number(newUserId), board: boardId },
      { headers: authHeaders }
    );
    setMembers(prev => [...prev, res.data]);
    setNewUserId('');
  };

  const removeMember = async (id: number) => {
    await axios.delete(`${API_URL}/board-members/${id}/`, { headers: authHeaders });
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div>
      <h4>Учасники дошки</h4>
      {members.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span>{m.user.username}</span>
          {isAdmin ? (
            <select value={m.role} onChange={e => changeRole(m.id, e.target.value as 'admin' | 'member')}>
              <option value="admin">Адмін</option>
              <option value="member">Учасник</option>
            </select>
          ) : (
            <span>{m.role === 'admin' ? 'Адмін' : 'Учасник'}</span>
          )}
          {isAdmin && (
            <button onClick={() => removeMember(m.id)} style={{ marginLeft: 'auto' }}>
              Видалити
            </button>
          )}
        </div>
      ))}

      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            type="number"
            placeholder="ID користувача"
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={addMember}>Додати</button>
        </div>
      )}
    </div>
  );
};
