import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Checklist } from './Checklist';
import { CardType, ChecklistType, CommentType, AttachmentType } from './Card';

const API_URL = API_BASE_URL;

type Tab = 'details' | 'checklists' | 'comments' | 'attachments';

type Props = {
  card: CardType | null;
  onClose: () => void;
  onUpdated: () => void;
};

export const CardModal: React.FC<Props> = ({ card, onClose, onUpdated }) => {
  const { authToken } = useAuth();
  const headers = authToken ? { Authorization: `Token ${authToken}` } : {};
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [localCard, setLocalCard] = useState<CardType | null>(card);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    setLocalCard(card);
  }, [card]);

  if (!localCard) return null;

  const saveDetails = async () => {
    await axios.patch(
      `${API_URL}/cards/${localCard.id}/`,
      {
        title: localCard.title,
        description: localCard.description,
        due_date: localCard.due_date,
      },
      { headers }
    );
    onUpdated();
  };

  const addChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    await axios.post(
      `${API_URL}/checklists/`,
      { card: localCard.id, title: newChecklistTitle },
      { headers }
    );
    setNewChecklistTitle('');
    onUpdated();
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await axios.post(
      `${API_URL}/comments/`,
      { card: localCard.id, content: comment },
      { headers }
    );
    setComment('');
    onUpdated();
  };

  const copyCard = async () => {
    await axios.post(`${API_URL}/cards/${localCard.id}/copy/`, {}, { headers });
    onUpdated();
  };

  const archiveCard = async () => {
    await axios.patch(`${API_URL}/cards/${localCard.id}/`, { is_archived: true }, { headers });
    onUpdated();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', width: 700, maxHeight: '90vh', overflow: 'auto', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            style={{ fontSize: 20, fontWeight: 600, flex: 1, border: '1px solid #ddd', padding: 6 }}
            value={localCard.title}
            onChange={e => setLocalCard({ ...localCard, title: e.target.value })}
          />
          <button onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          {(['details','checklists','comments','attachments'] as Tab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ fontWeight: activeTab === t ? 700 : 400 }}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={localCard.description || ''}
              onChange={e => setLocalCard({ ...localCard, description: e.target.value })}
              placeholder="Опис"
              rows={4}
            />
            <input
              type="date"
              value={localCard.due_date ? localCard.due_date.substring(0, 10) : ''}
              onChange={e => setLocalCard({ ...localCard, due_date: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveDetails}>Зберегти</button>
              <button onClick={copyCard}>Копіювати</button>
              <button onClick={archiveCard}>Архівувати</button>
            </div>
          </div>
        )}

        {activeTab === 'checklists' && (
          <div>
            {(localCard.checklists || []).map((cl: ChecklistType) => (
              <Checklist key={cl.id} checklist={cl} onReload={onUpdated} />
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} placeholder="Назва чек-листа" />
              <button onClick={addChecklist}>Додати</button>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Новий коментар" style={{ flex: 1 }} />
              <button onClick={addComment}>Додати</button>
            </div>
            <ul>
              {(localCard.comments || []).map((c: CommentType) => (
                <li key={c.id} style={{ marginBottom: 6 }}>
                  <strong>{c.user?.username}</strong>: {c.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div>
            {(localCard.attachments || []).map((a: AttachmentType) => (
              <div key={a.id}>
                <a href={a.file} target="_blank" rel="noreferrer">{a.file}</a>
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              Завантаження вкладень потребує input type=file та FormData; додайте у місці використання.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
