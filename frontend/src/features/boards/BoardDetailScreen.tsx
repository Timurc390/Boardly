import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from './components/BoardColumn';
import { CardModal } from './components/CardModal';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../context/I18nContext';
import { Card, List } from '../../types';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  fetchBoardById, 
  updateBoardAction, 
  deleteBoardAction, 
  toggleFavoriteAction, 
  removeBoardMemberAction,
  addListAction,
  updateListAction,
  deleteListAction,
  copyListAction,
  moveListAction,
  addCardAction,
  updateCardAction,
  deleteCardAction,
  copyCardAction,
  moveCardAction,
  moveCardOptimistic,
  moveListOptimistic,
  addChecklistAction,
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction,
  addCommentAction,
  createLabelAction,
  updateLabelAction,
  deleteLabelAction,
  joinCardAction,
  leaveCardAction,
  removeCardMemberAction,
  clearCurrentBoard
} from '../../store/slices/boardSlice';

const PRESET_COLORS = [
  '#0079bf', '#d29034', '#519839', '#b04632', '#89609e', 
  '#cd5a91', '#4bbf6b', '#00aecc', '#838c91'
];

export const BoardDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  const { user } = useAppSelector(state => state.auth);
  const { currentBoard: board, loading: isLoading, error } = useAppSelector(state => state.board);
  const { currentBoard, loading, isLive } = useAppSelector(state => state.board);
  const isSyncing = !isLive && currentBoard;
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<'main' | 'background' | 'members' | 'archived'>('main');
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [collapsedLists, setCollapsedLists] = useState<number[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<number | ''>('');
  const [filterLabelId, setFilterLabelId] = useState<number | ''>('');
  const [filterDue, setFilterDue] = useState<'all' | 'overdue' | 'today' | 'week' | 'no_due'>('all');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchBoardById(Number(id)));
    }
    return () => {
      dispatch(clearCurrentBoard());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (board) setBoardTitle(board.title);
  }, [board]);

  useEffect(() => {
    if (selectedCard && board?.lists) {
        const allCards = board.lists.flatMap(l => l.cards || []);
        const foundCard = allCards.find(c => c.id === selectedCard.id);
        if (foundCard) setSelectedCard(foundCard);
    }
  }, [board, selectedCard]);

  useEffect(() => {
    if (!board) return;
    const params = new URLSearchParams(location.search);
    const cardId = params.get('card');
    if (!cardId) return;
    const allCards = board.lists?.flatMap(l => l.cards || []) || [];
    const foundCard = allCards.find(c => c.id === Number(cardId));
    if (foundCard) setSelectedCard(foundCard);
  }, [board, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setFilterQuery(q);
  }, [location.search]);

  if (isLoading && !board) return <div className="loading-state">{t('common.loading')}</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!board) return null;

  const isOwner = board.owner?.id === user?.id;
  const isAdmin = board.members?.some(m => m.user.id === user?.id && m.role === 'admin');
  const canManageMembers = isOwner || isAdmin;
  const activeLists = board.lists?.filter(l => !l.is_archived) || [];
  const archivedLists = board.lists?.filter(l => l.is_archived) || [];
  const archivedCards = board.lists?.flatMap(l => (l.cards || []).filter(c => c.is_archived)) || [];

  const matchesFilters = (card: Card) => {
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const title = card.title?.toLowerCase() || '';
      const desc = card.description?.toLowerCase() || '';
      if (!title.includes(q) && !desc.includes(q)) return false;
    }
    if (filterMemberId) {
      if (!card.members?.some(m => m.id === filterMemberId)) return false;
    }
    if (filterLabelId) {
      if (!card.labels?.some(l => l.id === filterLabelId)) return false;
    }
    if (filterCompleted === 'completed' && !card.is_completed) return false;
    if (filterCompleted === 'incomplete' && card.is_completed) return false;

    if (filterDue !== 'all') {
      if (!card.due_date) {
        if (filterDue !== 'no_due') return false;
      } else {
        const due = new Date(card.due_date);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        if (filterDue === 'overdue' && !(due < startOfToday)) return false;
        if (filterDue === 'today' && !(due >= startOfToday && due < endOfToday)) return false;
        if (filterDue === 'week' && !(due >= startOfToday && due < endOfWeek)) return false;
        if (filterDue === 'no_due') return false;
      }
    }
    return true;
  };

  const filteredLists = activeLists.map(list => ({
    ...list,
    cards: (list.cards || []).filter(c => !c.is_archived && matchesFilters(c))
  }));

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const order = board.lists ? board.lists.length + 1 : 1;
    dispatch(addListAction({ boardId: board.id, title: newListTitle, order }));
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleTitleBlur = () => {
    if (boardTitle !== board.title) {
        dispatch(updateBoardAction({ id: board.id, data: { title: boardTitle } }));
    }
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/invite/${board.invite_link}`;
    navigator.clipboard.writeText(link);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      dispatch(moveListOptimistic({ sourceIndex: source.index, destIndex: destination.index }));
      const listId = Number(draggableId.replace('list-', ''));
      dispatch(moveListAction({ listId, order: destination.index + 1 }));
      return;
    }

    const cardId = Number(draggableId.replace('card-', ''));
    const sourceListId = Number(source.droppableId.replace('list-', ''));
    const destListId = Number(destination.droppableId.replace('list-', ''));

    dispatch(moveCardOptimistic({
      cardId,
      sourceListId,
      destListId,
      newIndex: destination.index
    }));

    dispatch(moveCardAction({
      cardId,
      listId: destListId,
      order: destination.index + 1
    }));
  };

  const toggleListCollapse = (listId: number) => {
    setCollapsedLists(prev => 
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    );
  };

  return (
    <div className="board-detail-page" style={{ 
      backgroundColor: board.background_url?.startsWith('#') ? board.background_url : undefined,
      backgroundImage: board.background_url && !board.background_url.startsWith('#') ? `url(${board.background_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: 'calc(100vh - 64px)', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div className="board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/boards" className="btn-link" style={{color: 'white', fontSize: '20px', textDecoration: 'none'}}>←</Link>
            <input 
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="board-title-input"
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', fontWeight: 'bold', width: 'auto', minWidth: '100px' }}
            />
            <button 
                onClick={() => dispatch(toggleFavoriteAction(board.id))} 
                className="btn-icon" 
                style={{ color: board.is_favorite ? '#FFC107' : 'rgba(255,255,255,0.5)', fontSize: '20px' }}
            >
                {board.is_favorite ? '★' : '☆'}
            </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setIsFilterOpen(true)}>🔎 Фільтри</button>
            <button className="btn-secondary" onClick={() => { setIsMenuOpen(true); setActiveMenuTab('main'); }}>••• Меню</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board-drop-zone" direction="horizontal" type="list">
          {(provided) => (
            <div
              className="board-canvas"
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'flex-start', overflowX: 'auto', height: '100%', padding: '24px', gap: '24px' }}
            >
              {filteredLists.map((list, index) => (
                <BoardColumn 
                  key={list.id} 
                  list={list} 
                  index={index} 
                  onAddCard={(lid, title) => {
                      const order = (list.cards?.length || 0) + 1;
                      dispatch(addCardAction({ listId: lid, title, order }));
                  }}
                  onUpdateList={(lid, data) => dispatch(updateListAction({ listId: lid, data }))}
                  onDeleteList={(lid) => {
                      if(window.confirm(t('common.confirmDelete'))) dispatch(deleteListAction(lid));
                  }}
                  onCopyList={(lid) => dispatch(copyListAction({ listId: lid }))}
                  onCardClick={setSelectedCard}
                  onToggleCardComplete={(cardId, next) => dispatch(updateCardAction({ cardId, data: { is_completed: next } }))}
                  isCollapsed={collapsedLists.includes(list.id)}
                  onToggleCollapse={() => toggleListCollapse(list.id)}
                />
              ))}
              {provided.placeholder}

              <div className="add-list-wrapper">
                {isAddingList ? (
                  <form onSubmit={handleCreateList}>
                    <input name="listTitle" className="form-input" autoFocus placeholder="Назва списку..." value={newListTitle} onChange={e => setNewListTitle(e.target.value)} style={{ marginBottom: 8, background: '#222' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="submit" size="sm" variant="primary">Додати</Button>
                      <button type="button" onClick={() => setIsAddingList(false)} className="btn-secondary btn-sm" style={{ width: 'auto', background: 'transparent', color: 'white', border: '1px solid #555' }}>✕</button>
                    </div>
                  </form>
                ) : (
                  <button className="btn-add-list" onClick={() => setIsAddingList(true)}>+ Додати список</button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {selectedCard && (
          <CardModal 
             card={selectedCard}
             board={board}
             isOpen={!!selectedCard}
             onClose={() => setSelectedCard(null)}
             onCopyLink={() => {
               const url = `${window.location.origin}/boards/${board.id}?card=${selectedCard.id}`;
               navigator.clipboard.writeText(url);
             }}
             onUpdateCard={(data) => dispatch(updateCardAction({ cardId: selectedCard.id, data }))}
             onDeleteCard={() => dispatch(deleteCardAction(selectedCard.id))}
             onCopyCard={() => dispatch(copyCardAction({ cardId: selectedCard.id, listId: selectedCard.list }))}
             onAddChecklist={(title) => dispatch(addChecklistAction({ cardId: selectedCard.id, title }))}
             onAddChecklistItem={(checklistId, text) => dispatch(addChecklistItemAction({ checklistId, text }))}
             onDeleteChecklistItem={(itemId, checklistId) => dispatch(deleteChecklistItemAction({ itemId, checklistId }))}
             onToggleChecklistItem={(itemId, is_checked) => dispatch(updateChecklistItemAction({ itemId, data: { is_checked } }))}
             onUpdateChecklistItem={(itemId, text) => dispatch(updateChecklistItemAction({ itemId, data: { text } }))}
             onAddComment={(text) => dispatch(addCommentAction({ cardId: selectedCard.id, text }))}
             onUpdateLabels={(label_ids) => dispatch(updateCardAction({ cardId: selectedCard.id, data: { label_ids } }))}
             onCreateLabel={(name, color) => dispatch(createLabelAction({ boardId: board.id, name, color }))}
             onUpdateLabel={(id, name, color) => dispatch(updateLabelAction({ id, data: { name, color } }))}
             onDeleteLabel={(id) => dispatch(deleteLabelAction(id))}
             onJoinCard={() => dispatch(joinCardAction(selectedCard.id))}
             onLeaveCard={() => dispatch(leaveCardAction(selectedCard.id))}
             onRemoveMember={(userId) => dispatch(removeCardMemberAction({ cardId: selectedCard.id, userId }))}
          />
      )}

      {isFilterOpen && (
        <div className="modal-overlay" onClick={() => setIsFilterOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Фільтри</h3>
              <button className="modal-close" onClick={() => setIsFilterOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select
                className="form-input"
                value={filterMemberId}
                onChange={(e) => setFilterMemberId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Всі учасники</option>
                {(board.members || []).map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.username || m.user.email}</option>
                ))}
              </select>
              <select
                className="form-input"
                value={filterLabelId}
                onChange={(e) => setFilterLabelId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Всі мітки</option>
                {(board.labels || []).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select
                className="form-input"
                value={filterDue}
                onChange={(e) => setFilterDue(e.target.value as any)}
              >
                <option value="all">Будь-який дедлайн</option>
                <option value="overdue">Прострочені</option>
                <option value="today">На сьогодні</option>
                <option value="week">На тиждень</option>
                <option value="no_due">Без дедлайну</option>
              </select>
              <select
                className="form-input"
                value={filterCompleted}
                onChange={(e) => setFilterCompleted(e.target.value as any)}
              >
                <option value="all">Всі</option>
                <option value="completed">Завершені</option>
                <option value="incomplete">Незавершені</option>
              </select>
            </div>
            <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setFilterMemberId('');
                    setFilterLabelId('');
                    setFilterDue('all');
                    setFilterCompleted('all');
                  }}
                >
                Скинути
              </button>
              <button type="button" className="btn-primary" onClick={() => setIsFilterOpen(false)}>
                Застосувати
              </button>
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="menu-sidebar-overlay" onClick={() => setIsMenuOpen(false)}>
            <div className="menu-sidebar" onClick={e => e.stopPropagation()}>
               <div className="menu-header">
                    {activeMenuTab !== 'main' && <button className="btn-icon" onClick={() => setActiveMenuTab('main')}>←</button>}
                    <h3>Меню</h3>
                    <button className="btn-icon" onClick={() => setIsMenuOpen(false)}>✕</button>
                </div>
                <div className="menu-content">
                    {activeMenuTab === 'main' && (
                        <>
                            <ul className="menu-list">
                                <li onClick={() => setActiveMenuTab('background')}>🖼️ Змінити фон</li>
                                <li onClick={() => setActiveMenuTab('members')}>👥 Учасники</li>
                                <li onClick={() => setActiveMenuTab('archived')}>🗄️ Архівовані елементи</li>
                            </ul>
                            <div className="menu-divider"></div>
                            <div style={{ padding: '0 12px' }}>
                                <h4 style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Запросити</h4>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="form-input" readOnly value={`${window.location.origin}/invite/${board.invite_link}`} style={{ fontSize: '12px', padding: '6px' }} />
                                    <button className="btn-primary" style={{ width: 'auto', padding: '6px 12px' }} onClick={handleCopyInvite}>Copy</button>
                                </div>
                            </div>
                            <div className="menu-divider"></div>
                            <ul className="menu-list">
                                <li onClick={() => dispatch(updateBoardAction({ id: board.id, data: { is_archived: !board.is_archived } }))}>
                                    {board.is_archived ? 'Відновити' : 'Закрити'} дошку
                                </li>
                                <li onClick={async () => {
                                    if(isOwner && window.confirm('Видалити дошку?')) {
                                        await dispatch(deleteBoardAction(board.id));
                                        navigate('/boards');
                                    }
                                }} style={{ color: 'var(--danger)' }}>
                                    {isOwner ? 'Видалити дошку' : 'Покинути дошку'}
                                </li>
                            </ul>
                        </>
                    )}
                    {activeMenuTab === 'members' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h4 style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Учасники дошки</h4>
                            {(board.members || []).length === 0 && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Немає учасників</div>
                            )}
                            {(board.members || []).map(member => (
                                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontSize: 13 }}>
                                            {member.user.username || member.user.email}
                                            {member.user.id === board.owner?.id && (
                                              <span style={{ marginLeft: 6, color: 'var(--text-secondary)' }}>(Власник)</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{member.role}</div>
                                    </div>
                                    {canManageMembers && member.user.id !== board.owner?.id && (
                                        <button
                                            type="button"
                                            className="btn-secondary btn-sm"
                                            style={{ color: 'var(--danger)' }}
                                            onClick={() => dispatch(removeBoardMemberAction(member.id))}
                                        >
                                            Видалити
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {activeMenuTab === 'archived' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Архівовані списки</h4>
                                {archivedLists.length === 0 && (
                                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Немає списків</div>
                                )}
                                {archivedLists.map(list => (
                                    <div key={list.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                                        <div style={{ fontSize: 13 }}>{list.title}</div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                className="btn-secondary btn-sm"
                                                onClick={() => dispatch(updateListAction({ listId: list.id, data: { is_archived: false } }))}
                                            >
                                                Відновити
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-secondary btn-sm"
                                                style={{ color: 'var(--danger)' }}
                                                onClick={() => dispatch(deleteListAction(list.id))}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Архівовані картки</h4>
                                {archivedCards.length === 0 && (
                                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Немає карток</div>
                                )}
                                {archivedCards.map(card => (
                                    <div key={card.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                                        <div style={{ fontSize: 13 }}>
                                          {card.title}
                                          <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginLeft: 6 }}>
                                            {board.lists?.find(l => l.id === card.list)?.title}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                className="btn-secondary btn-sm"
                                                onClick={() => dispatch(updateCardAction({ cardId: card.id, data: { is_archived: false } }))}
                                            >
                                                Відновити
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-secondary btn-sm"
                                                style={{ color: 'var(--danger)' }}
                                                onClick={() => dispatch(deleteCardAction(card.id))}
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
