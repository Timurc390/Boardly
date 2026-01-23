import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useBoardDetail } from './hooks/useBoardDetail';
import { BoardColumn } from './components/BoardColumn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';

const PRESET_COLORS = [
  '#0079bf', '#d29034', '#519839', '#b04632', '#89609e', 
  '#cd5a91', '#4bbf6b', '#00aecc', '#838c91'
];

export const BoardDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    board, isLoading, error, 
    addList, addCard, onDragEnd, 
    updateBoardData, deleteBoardData,
    updateListData, deleteListData,
    toggleFavorite, archiveBoard, removeMemberFromBoard
  } = useBoardDetail(Number(id));
  const { t } = useI18n();
  
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  // --- MENU STATES ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<'main' | 'background' | 'members' | 'archived'>('main');
  const [boardTitle, setBoardTitle] = useState('');

  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => setIsBrowser(true), []);

  useEffect(() => {
    if (board) setBoardTitle(board.title);
  }, [board]);

  if (isLoading) return <div className="loading-state">{t('common.loading')}</div>;
  if (error || !board) return <div className="error-state">{error || t('common.error')}</div>;

  // Визначаємо, чи є поточний користувач власником
  const isOwner = board.owner?.id === user?.id;

  // --- Handlers ---
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      await addList(newListTitle);
      setNewListTitle('');
      setIsAddingList(false);
    } catch (err: any) {
      console.error("Error:", err);
      if (err.response?.data) alert(`Error: ${JSON.stringify(err.response.data)}`);
    }
  };

  const handleTitleBlur = () => {
    if (boardTitle !== board.title) updateBoardData({ title: boardTitle });
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/invite/${board.invite_link}`;
    navigator.clipboard.writeText(link);
    alert('Посилання скопійовано!');
  };

  // Розумне видалення / вихід
  const handleDeleteOrLeaveBoard = async () => {
    if (isOwner) {
      // Логіка для власника: Видалити дошку повністю
      if (window.confirm('Ви впевнені, що хочете видалити цю дошку? Це неможливо відмінити.')) {
        try {
          await deleteBoardData();
          navigate('/boards');
        } catch (e) {
          alert('Не вдалося видалити дошку');
        }
      }
    } else {
      // Логіка для учасника: Покинути дошку
      if (window.confirm('Ви впевнені, що хочете покинути цю дошку?')) {
        try {
          // Знаходимо ID свого membership
          const myMembership = board.members?.find(m => m.user.id === user?.id);
          if (myMembership) {
            await removeMemberFromBoard(myMembership.id);
            navigate('/boards');
          } else {
            alert('Помилка: не вдалося знайти ваші дані учасника.');
          }
        } catch (e) {
          alert('Не вдалося покинути дошку');
        }
      }
    }
  };

  const activeLists = board.lists?.filter(l => !l.is_archived) || [];
  const archivedLists = board.lists?.filter(l => l.is_archived) || [];

  if (!isBrowser) return null;

  return (
    <div className="board-detail-page" style={{ 
      backgroundColor: board.background_url && board.background_url.startsWith('#') ? board.background_url : undefined,
      backgroundImage: board.background_url && !board.background_url.startsWith('#') ? `url(${board.background_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: 'calc(100vh - 64px)', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* --- BOARD HEADER --- */}
      <div className="board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/boards" className="btn-link" style={{color: 'white', fontSize: '20px', textDecoration: 'none'}}>←</Link>
            
            <input 
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="board-title-input"
              style={{ 
                background: 'transparent', border: 'none', color: 'white', 
                fontSize: '18px', fontWeight: 'bold', width: 'auto', minWidth: '100px' 
              }}
            />

            <button 
                onClick={toggleFavorite}
                className="btn-icon"
                style={{ color: board.is_favorite ? '#FFC107' : 'rgba(255,255,255,0.5)', fontSize: '20px' }}
                title="Додати до обраного"
            >
                {board.is_favorite ? '★' : '☆'}
            </button>
        </div>
        
        <div>
            <button 
                className="btn-secondary" 
                style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', padding: '6px 12px', fontSize: '14px' }}
                onClick={() => { setIsMenuOpen(true); setActiveMenuTab('main'); }}
            >
                ••• Меню
            </button>
        </div>
      </div>

      {/* --- KANBAN CANVAS --- */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board-drop-zone" direction="horizontal" type="list">
          {(provided) => (
            <div
              className="board-canvas"
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'flex-start',  
                overflowX: 'auto', overflowY: 'hidden', height: '100%', padding: '24px', gap: '24px'
              }}
            >
              {activeLists.map((list, index) => (
                <BoardColumn 
                  key={list.id} list={list} index={index} onAddCard={addCard}
                  onUpdateList={updateListData} onDeleteList={deleteListData}
                />
              ))}
              {provided.placeholder}

              <div className="add-list-wrapper">
                {isAddingList ? (
                  <form onSubmit={handleCreateList}>
                    <input name="listTitle" className="form-input" autoFocus placeholder="Назва списку..." value={newListTitle} onChange={e => setNewListTitle(e.target.value)} style={{ marginBottom: 8, background: '#222' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="submit" size="sm" className="btn-primary">Додати</Button>
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

      {/* --- BOARD MENU SIDEBAR --- */}
      {isMenuOpen && (
        <div className="menu-sidebar-overlay" onClick={() => setIsMenuOpen(false)}>
            <div className="menu-sidebar" onClick={e => e.stopPropagation()}>
                <div className="menu-header">
                    {activeMenuTab !== 'main' && (
                        <button className="btn-icon" onClick={() => setActiveMenuTab('main')}>←</button>
                    )}
                    <h3>
                        {activeMenuTab === 'main' ? 'Меню' : 
                         activeMenuTab === 'background' ? 'Зміна фону' :
                         activeMenuTab === 'members' ? 'Учасники' : 'Архів'}
                    </h3>
                    <button className="btn-icon" onClick={() => setIsMenuOpen(false)}>✕</button>
                </div>
                
                <div className="menu-content">
                    {/* MAIN TAB */}
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
                                <li onClick={archiveBoard} style={{ color: board.is_archived ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {board.is_archived ? '↩️ Відновити дошку' : '🔒 Закрити дошку'}
                                </li>
                                <li onClick={handleDeleteOrLeaveBoard} style={{ color: 'var(--danger)' }}>
                                    {isOwner ? '🗑️ Видалити дошку' : '🚪 Покинути дошку'}
                                </li>
                            </ul>
                        </>
                    )}

                    {/* BACKGROUND TAB */}
                    {activeMenuTab === 'background' && (
                        <div className="background-grid">
                            {PRESET_COLORS.map(color => (
                                <div 
                                    key={color} 
                                    className="bg-swatch" 
                                    style={{ backgroundColor: color }}
                                    onClick={() => updateBoardData({ background_url: color })}
                                />
                            ))}
                        </div>
                    )}

                    {/* MEMBERS TAB */}
                    {activeMenuTab === 'members' && (
                        <div className="members-list">
                            <p style={{fontSize:'13px', color:'#888', marginBottom:'12px'}}>
                                {isOwner ? 'Ви можете керувати учасниками.' : 'Список учасників.'}
                            </p>
                            {board.members?.map(member => (
                                <div key={member.id} className="member-item">
                                    <div className="member-avatar">{member.user.username[0].toUpperCase()}</div>
                                    <div className="member-info">
                                        <div className="member-name">{member.user.first_name} {member.user.last_name || member.user.username}</div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                    {/* Тільки власник/адмін може видаляти інших (крім себе тут) */}
                                    {isOwner && user?.id !== member.user.id && (
                                        <button className="btn-icon" style={{color: '#ff6b6b'}} onClick={() => removeMemberFromBoard(member.id)}>✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ARCHIVED TAB */}
                    {activeMenuTab === 'archived' && (
                        <div className="archived-list">
                            {archivedLists.length === 0 && <p style={{textAlign:'center', color:'#888'}}>Пусто</p>}
                            {archivedLists.map(list => (
                                <div key={list.id} className="archived-item">
                                    <span>{list.title}</span>
                                    <button className="btn-link" onClick={() => updateListData(list.id, { is_archived: false })}>Відновити</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};