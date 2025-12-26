import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { ChecklistItemType, ChecklistType } from './Card';

type ChecklistProps = {
  checklist: ChecklistType;
  onReload: () => void;
};

const API_URL = API_BASE_URL;

export const Checklist: React.FC<ChecklistProps> = ({ checklist, onReload }) => {
  const { authToken } = useAuth();
  const headers = authToken ? { Authorization: `Token ${authToken}` } : {};
  const [newItem, setNewItem] = useState('');

  const toggleItem = async (item: ChecklistItemType) => {
    await axios.patch(
      `${API_URL}/checklist-items/${item.id}/`,
      { is_checked: !item.is_checked },
      { headers }
    );
    onReload();
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    await axios.post(
      `${API_URL}/checklist-items/`,
      { checklist: checklist.id, text: newItem },
      { headers }
    );
    setNewItem('');
    onReload();
  };

  const deleteItem = async (id: number) => {
    await axios.delete(`${API_URL}/checklist-items/${id}/`, { headers });
    onReload();
  };

  const progress =
    checklist.items?.length
      ? `${checklist.items.filter(i => i.is_checked).length}/${checklist.items.length}`
      : '0/0';

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{checklist.title}</strong>
        <span style={{ fontSize: 12, color: '#555' }}>☑ {progress}</span>
      </div>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {checklist.items?.map(item => (
          <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={item.is_checked} onChange={() => toggleItem(item)} />
            <span style={{ flex: 1, textDecoration: item.is_checked ? 'line-through' : 'none' }}>{item.text}</span>
            <button onClick={() => deleteItem(item.id)}>✕</button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Новий пункт"
          style={{ flex: 1 }}
        />
        <button onClick={addItem}>Додати</button>
      </div>
    </div>
  );
};
