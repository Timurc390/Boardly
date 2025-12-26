import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

type Filters = {
  q?: string;
  member?: string;
  label?: string;
  due_from?: string;
  due_to?: string;
  board_id?: number;
};

export const BoardFilters: React.FC<{
  boardId?: number;
  onResults: (cards: any[]) => void;
}> = ({ boardId, onResults }) => {
  const { authToken } = useAuth();
  const [filters, setFilters] = useState<Filters>({ board_id: boardId });

  const authHeaders = authToken ? { Authorization: `Token ${authToken}` } : {};

  const search = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const res = await axios.get(`${API_URL}/cards/?${params.toString()}`, { headers: authHeaders });
    onResults(res.data);
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input placeholder="Пошук" value={filters.q || ''} onChange={e => setFilters({ ...filters, q: e.target.value })} />
      <input
        placeholder="ID учасника"
        value={filters.member || ''}
        onChange={e => setFilters({ ...filters, member: e.target.value })}
      />
      <input
        placeholder="ID мітки"
        value={filters.label || ''}
        onChange={e => setFilters({ ...filters, label: e.target.value })}
      />
      <input type="date" value={filters.due_from || ''} onChange={e => setFilters({ ...filters, due_from: e.target.value })} />
      <input type="date" value={filters.due_to || ''} onChange={e => setFilters({ ...filters, due_to: e.target.value })} />
      <button onClick={search}>Фільтрувати</button>
    </div>
  );
};
