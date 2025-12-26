import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Card, CardType } from '../components/Card';
import { CardModal } from '../components/CardModal';

const API_URL = API_BASE_URL;

type ListType = { id: number; title: string; order: number; cards: CardType[] };

export const BoardScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);
  const { authToken } = useAuth();
  const headers = authToken ? { Authorization: `Token ${authToken}` } : {};

  const [lists, setLists] = useState<ListType[]>([]);
  const [modalCard, setModalCard] = useState<CardType | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitle, setNewCardTitle] = useState<Record<number, string>>({});

  const fetchBoard = async () => {
    const res = await axios.get(`${API_URL}/lists/?board_id=${boardId}`, { headers });
    setLists(res.data);
  };

  useEffect(() => {
    if (boardId) fetchBoard();
  }, [boardId]);

  const addList = async () => {
    if (!newListTitle.trim()) return;
    await axios.post(`${API_URL}/lists/`, { board: boardId, title: newListTitle }, { headers });
    setNewListTitle('');
    fetchBoard();
  };

  const addCard = async (listId: number) => {
    const title = newCardTitle[listId];
    if (!title?.trim()) return;
    await axios.post(`${API_URL}/cards/`, { list: listId, title, order: 0 }, { headers });
    setNewCardTitle({ ...newCardTitle, [listId]: '' });
    fetchBoard();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceListId = Number(result.source.droppableId);
    const destListId = Number(result.destination.droppableId);
    if (sourceListId === destListId) {
      const list = lists.find(l => l.id === sourceListId);
      if (!list) return;
      const newCards = Array.from(list.cards);
      const [moved] = newCards.splice(result.source.index, 1);
      newCards.splice(result.destination.index, 0, moved);
      const payload = newCards.map((c, idx) => ({ id: c.id, order: idx, list: sourceListId }));
      await axios.post(`${API_URL}/cards/reorder/`, payload, { headers });
      fetchBoard();
    } else {
      const sourceList = lists.find(l => l.id === sourceListId);
      if (!sourceList) return;
      const card = sourceList.cards[result.source.index];
      const destList = lists.find(l => l.id === destListId);
      if (!destList) return;
      const newSourceCards = Array.from(sourceList.cards);
      newSourceCards.splice(result.source.index, 1);
      const newDestCards = Array.from(destList.cards);
      newDestCards.splice(result.destination.index, 0, card);
      const payload = newDestCards.map((c, idx) => ({ id: c.id, order: idx, list: destListId }));
      await axios.post(`${API_URL}/cards/reorder/`, payload, { headers });
      await axios.patch(`${API_URL}/cards/${card.id}/`, { list: destListId }, { headers });
      fetchBoard();
    }
  };

  return (
    <div style={{ background: '#eef2f6', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span role="img" aria-label="board" style={{ fontSize: 28 }}>🧭</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, color: '#0b2744' }}>Дошка</div>
              <div style={{ color: '#5a6b7b', fontSize: 14 }}>Організовуйте списки та картки drag & drop.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
              placeholder="Новий список"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d0d7de', minWidth: 200 }}
            />
            <button
              onClick={addList}
              style={{
                background: '#026AA7',
                color: 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Додати список
            </button>
          </div>
        </div>

        <div style={{ background: 'white', padding: 12, borderRadius: 12, boxShadow: '0 6px 16px rgba(15,23,32,0.08)' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
              {lists.map(list => (
                <Droppable droppableId={String(list.id)} type="CARD" key={list.id}>
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        background: '#f8fafc',
                        padding: 10,
                        width: 280,
                        borderRadius: 10,
                        flexShrink: 0,
                        border: '1px solid #e1e6eb',
                        boxShadow: '0 4px 12px rgba(15,23,32,0.05)',
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 10, color: '#0b2744' }}>{list.title}</div>
                      {(list.cards || []).map((card, idx) => (
                        <Card key={card.id} card={card} index={idx} onOpen={setModalCard} />
                      ))}
                      {provided.placeholder}
                      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                        <input
                          value={newCardTitle[list.id] || ''}
                          onChange={e => setNewCardTitle({ ...newCardTitle, [list.id]: e.target.value })}
                          placeholder="Нова картка"
                          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d7de' }}
                        />
                        <button
                          onClick={() => addCard(list.id)}
                          style={{
                            background: '#026AA7',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      {modalCard && (
        <CardModal
          card={modalCard}
          onClose={() => setModalCard(null)}
          onUpdated={() => {
            fetchBoard();
            setModalCard(null);
          }}
        />
      )}
    </div>
  );
};
