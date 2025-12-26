import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

type Favorite = { id: number; board: number };

export const FavoriteButton: React.FC<{ boardId: number }> = ({ boardId }) => {
  const { authToken } = useAuth();
  const [favorite, setFavorite] = useState<Favorite | null>(null);

  const authHeaders = authToken ? { Authorization: `Token ${authToken}` } : {};

  useEffect(() => {
    if (!authToken) return;
    axios
      .get<Favorite[]>(`${API_URL}/favorites/?board_id=${boardId}`, { headers: authHeaders })
      .then(res => setFavorite(res.data[0] ?? null))
      .catch(console.error);
  }, [boardId, authToken]);

  const toggle = async () => {
    if (!authToken) return;
    if (favorite) {
      await axios.delete(`${API_URL}/favorites/${favorite.id}/`, { headers: authHeaders });
      setFavorite(null);
    } else {
      const res = await axios.post<Favorite>(`${API_URL}/favorites/`, { board: boardId }, { headers: authHeaders });
      setFavorite(res.data);
    }
  };

  return (
    <button onClick={toggle} title="В обране" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
      {favorite ? '★ Обрана' : '☆ В обране'}
    </button>
  );
};
