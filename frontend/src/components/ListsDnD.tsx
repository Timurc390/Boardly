import React from 'react';
import axios from 'axios';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
  type DroppableProvided,
  type DraggableProvided,
} from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

export type ListItem = {
  id: number;
  title: string;
  order: number;
};

type Props = {
  boardId: number;
  lists: ListItem[];
  setLists: (lists: ListItem[]) => void;
};

export const ListsDnD: React.FC<Props> = ({ boardId, lists, setLists }) => {
  const { authToken } = useAuth();
  const authHeaders = authToken ? { Authorization: `Token ${authToken}` } : {};

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newLists = Array.from(lists);
    const [moved] = newLists.splice(result.source.index, 1);
    newLists.splice(result.destination.index, 0, moved);
    const reordered = newLists.map((l, idx) => ({ ...l, order: idx }));
    setLists(reordered);
    await axios.post(`${API_URL}/lists/reorder/`, reordered.map(l => ({ id: l.id, order: l.order, board: boardId })), {
      headers: authHeaders,
    });
  };

  const copyList = async (listId: number) => {
    const res = await axios.post(
      `${API_URL}/lists/${listId}/copy/`,
      { order: lists.length, title: `${lists.find(l => l.id === listId)?.title || ''} (копія)` },
      { headers: authHeaders }
    );
    setLists([...lists, res.data]);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" direction="horizontal">
        {(provided: DroppableProvided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', gap: 12 }}>
            {lists.map((list, index) => (
              <Draggable draggableId={String(list.id)} index={index} key={list.id}>
                {(prov: DraggableProvided) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      padding: 12,
                      width: 220,
                      background: '#fff',
                      ...prov.draggableProps.style,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{list.title}</strong>
                      <button onClick={() => copyList(list.id)}>Копіювати</button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
