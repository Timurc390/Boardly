import React from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FiHelpCircle, FiX } from 'shared/ui/fiIcons';
import {
  DragDropContext,
  Droppable,
  type BeforeCapture,
  type DragStart,
  type DragUpdate,
  type DropResult,
} from '@hello-pangea/dnd';
import { Button } from '../../../components/ui/Button';
import { type ActivityLog, type Board, type Card, type List, type User } from '../../../types';
import { BoardActivityModal } from './BoardActivityModal';
import { BoardColumn } from './BoardColumn';
import { BoardFiltersModal } from './BoardFiltersModal';
import { BoardHeader } from './BoardHeader';
import { BoardMenuSidebar } from './BoardMenuSidebar';
import { CardModal } from './CardModal';

type BackgroundOption = {
  key: string;
  value: string;
  label: string;
  preview?: string;
};

type BoardMember = NonNullable<Board['members']>[number];
type HeaderMember = { user: User; membership?: BoardMember };

type BoardDetailContentProps = {
  topToast: string | null;
  isTouch: boolean;
  isListDragging: boolean;
  backgroundStyle: React.CSSProperties;
  board: Board;
  boardTitle: string;
  canEditBoard: boolean;
  onBoardTitleChange: React.Dispatch<React.SetStateAction<string>>;
  onBoardTitleBlur: () => void;
  onToggleFavorite: () => void;
  boardIconSrc: string;
  boardIconLetter: string;
  boardIconFailed: boolean;
  onBoardIconError: () => void;
  isGlobalMenuOpen: boolean;
  onToggleGlobalMenu: () => void;
  onCloseGlobalMenu: () => void;
  onLogout: () => void;
  headerMembers: HeaderMember[];
  visibleMembers: User[];
  extraMembersCount: number;
  headerMemberId: number | null;
  onToggleHeaderMember: (id: number | null) => void;
  onCloseHeaderMember: () => void;
  getAvatarSrc: (profile?: { avatar_url?: string | null; avatar?: string | null }) => string;
  fallbackAvatar: string;
  getMemberDisplayName: (user: BoardMember['user']) => string;
  canManageMembers: boolean;
  ownerId?: number;
  currentUserId?: number;
  onOpenMemberActivity: (member: BoardMember) => void;
  onToggleMemberRole: (member: BoardMember, role: 'admin' | 'developer' | 'viewer') => void;
  onRemoveMember: (membershipId: number) => void;
  filterQuery: string;
  onSearchChange: (value: string) => void;
  onOpenFilter: () => void;
  onOpenMenu: () => void;
  onOpenMembersPanel: () => void;
  closeSignal: number;
  dragDropContextKey: number;
  onBeforeCapture: (start: BeforeCapture) => void;
  onBeforeDragStart: (start: DragStart) => void;
  onDragStart: (start: DragStart) => void;
  onDragUpdate: (update: DragUpdate) => void;
  onDragEnd: (result: DropResult) => void;
  boardCanvasRef: React.RefObject<HTMLDivElement | null>;
  filteredLists: List[];
  listOptions: Array<{ id: number; title: string }>;
  canAddCardToList: (list: List) => boolean;
  canEditCard: (card: Card) => boolean;
  onAddCard: (listId: number, title: string) => void;
  onUpdateList: (listId: number, data: Partial<List>) => void;
  onDeleteList: (listId: number) => void;
  onCopyList: (listId: number) => void;
  onArchiveAllCards: (listId: number) => void;
  onCardOpen: (card: Card) => void;
  onToggleCardComplete: (cardId: number, next: boolean) => void;
  openListMenuId: number | null;
  onToggleListMenu: (listId: number) => void;
  onCloseListMenu: () => void;
  collapsedLists: number[];
  onToggleCollapse: (listId: number) => void;
  onMoveList: (listId: number, fromIndex: number, toIndex: number) => void;
  onMoveCard: (cardId: number, sourceListId: number, destListId: number, destIndex: number) => void;
  isListMovePending: boolean;
  canCreateList: boolean;
  isAddingList: boolean;
  onCreateList: (event: React.FormEvent) => void;
  newListTitle: string;
  onNewListTitleChange: React.Dispatch<React.SetStateAction<string>>;
  onOpenAddList: () => void;
  onCloseAddList: () => void;
  t: (key: string) => string;
  selectedCard: Card | null;
  onCloseCardModal: () => void;
  onCopyCardLink: () => void;
  onUpdateSelectedCard: (data: Partial<Card>) => void;
  onDeleteCard: () => void;
  onCopyCard: () => void;
  onAddChecklist: (title: string) => Promise<{ id?: number } | null | void> | { id?: number } | null | void;
  onDeleteChecklist: (checklistId: number) => Promise<unknown> | void;
  onAddChecklistItem: (checklistId: number, text: string) => Promise<unknown> | void;
  onDeleteChecklistItem: (itemId: number, checklistId?: number) => Promise<unknown> | void;
  onToggleChecklistItem: (itemId: number, isChecked: boolean) => Promise<unknown> | void;
  onUpdateChecklistItem: (itemId: number, text: string) => Promise<unknown> | void;
  onAddComment: (text: string) => void;
  onUpdateComment: (commentId: number, text: string) => void;
  onDeleteComment: (commentId: number) => void;
  onUpdateCardLabels: (labelIds: number[]) => void;
  onCreateLabel: (name: string, color: string) => Promise<{ id?: number } | void> | void;
  onUpdateLabel: (id: number, name: string, color: string) => void;
  onDeleteLabel: (id: number) => void;
  onJoinCard: () => void;
  onLeaveCard: () => void;
  onRemoveCardMember: (userId: number) => void;
  onAddCardMember: (userId: number) => void;
  onAddAttachment: (file: File) => Promise<void> | void;
  onDeleteAttachment: (attachmentId: number) => void;
  isFilterOpen: boolean;
  onCloseFilter: () => void;
  filterMemberId: number | '';
  onFilterMemberChange: (value: number | '') => void;
  filterLabelId: number | '';
  onFilterLabelChange: (value: number | '') => void;
  filterDue: 'all' | 'overdue' | 'today' | 'week' | 'no_due';
  onFilterDueChange: (value: 'all' | 'overdue' | 'today' | 'week' | 'no_due') => void;
  filterCompleted: 'all' | 'completed' | 'incomplete';
  onFilterCompletedChange: (value: 'all' | 'completed' | 'incomplete') => void;
  labels: Board['labels'];
  onResetFilters: () => void;
  isMenuOpen: boolean;
  onCloseSidebar: () => void;
  activeMenuTab: 'main' | 'background' | 'members' | 'archived' | 'permissions';
  onTabChange: React.Dispatch<React.SetStateAction<'main' | 'background' | 'members' | 'archived' | 'permissions'>>;
  inviteLink: string;
  onInvite: () => void;
  canLeaveBoard: boolean;
  isOwner: boolean;
  onArchiveToggle: () => void;
  onDeleteBoard: () => void;
  onLeaveBoard: () => void;
  onUpdateBoardSettings: (data: Partial<Board>) => void;
  colorOptions: BackgroundOption[];
  gradientOptions: BackgroundOption[];
  imageOptions: BackgroundOption[];
  bgUrlInput: string;
  onBgUrlInputChange: React.Dispatch<React.SetStateAction<string>>;
  onBackgroundSelect: (value: string) => void;
  onBackgroundFile: (file?: File | null) => void;
  memberQuery: string;
  onMemberQueryChange: React.Dispatch<React.SetStateAction<string>>;
  filteredMembers: BoardMember[];
  activeMemberId: number | null;
  onToggleActiveMember: React.Dispatch<React.SetStateAction<number | null>>;
  archivedLists: List[];
  archivedCards: Card[];
  onUnarchiveList: (listId: number) => void;
  onDeleteListPermanent: (listId: number) => void;
  onUnarchiveCard: (cardId: number) => void;
  onDeleteCardPermanent: (cardId: number) => void;
  isActivityOpen: boolean;
  onCloseActivity: () => void;
  activityMember: BoardMember | null;
  activityLogs: ActivityLog[];
  isActivityLoading: boolean;
};

export const BoardDetailContent: React.FC<BoardDetailContentProps> = ({
  topToast,
  isTouch,
  isListDragging,
  backgroundStyle,
  board,
  boardTitle,
  canEditBoard,
  onBoardTitleChange,
  onBoardTitleBlur,
  onToggleFavorite,
  boardIconSrc,
  boardIconLetter,
  boardIconFailed,
  onBoardIconError,
  isGlobalMenuOpen,
  onToggleGlobalMenu,
  onCloseGlobalMenu,
  onLogout,
  headerMembers,
  visibleMembers,
  extraMembersCount,
  headerMemberId,
  onToggleHeaderMember,
  onCloseHeaderMember,
  getAvatarSrc,
  fallbackAvatar,
  getMemberDisplayName,
  canManageMembers,
  ownerId,
  currentUserId,
  onOpenMemberActivity,
  onToggleMemberRole,
  onRemoveMember,
  filterQuery,
  onSearchChange,
  onOpenFilter,
  onOpenMenu,
  onOpenMembersPanel,
  closeSignal,
  dragDropContextKey,
  onBeforeCapture,
  onBeforeDragStart,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  boardCanvasRef,
  filteredLists,
  listOptions,
  canAddCardToList,
  canEditCard,
  onAddCard,
  onUpdateList,
  onDeleteList,
  onCopyList,
  onArchiveAllCards,
  onCardOpen,
  onToggleCardComplete,
  openListMenuId,
  onToggleListMenu,
  onCloseListMenu,
  collapsedLists,
  onToggleCollapse,
  onMoveList,
  onMoveCard,
  isListMovePending,
  canCreateList,
  isAddingList,
  onCreateList,
  newListTitle,
  onNewListTitleChange,
  onOpenAddList,
  onCloseAddList,
  t,
  selectedCard,
  onCloseCardModal,
  onCopyCardLink,
  onUpdateSelectedCard,
  onDeleteCard,
  onCopyCard,
  onAddChecklist,
  onDeleteChecklist,
  onAddChecklistItem,
  onDeleteChecklistItem,
  onToggleChecklistItem,
  onUpdateChecklistItem,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onUpdateCardLabels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onJoinCard,
  onLeaveCard,
  onRemoveCardMember,
  onAddCardMember,
  onAddAttachment,
  onDeleteAttachment,
  isFilterOpen,
  onCloseFilter,
  filterMemberId,
  onFilterMemberChange,
  filterLabelId,
  onFilterLabelChange,
  filterDue,
  onFilterDueChange,
  filterCompleted,
  onFilterCompletedChange,
  labels,
  onResetFilters,
  isMenuOpen,
  onCloseSidebar,
  activeMenuTab,
  onTabChange,
  inviteLink,
  onInvite,
  canLeaveBoard,
  isOwner,
  onArchiveToggle,
  onDeleteBoard,
  onLeaveBoard,
  onUpdateBoardSettings,
  colorOptions,
  gradientOptions,
  imageOptions,
  bgUrlInput,
  onBgUrlInputChange,
  onBackgroundSelect,
  onBackgroundFile,
  memberQuery,
  onMemberQueryChange,
  filteredMembers,
  activeMemberId,
  onToggleActiveMember,
  archivedLists,
  archivedCards,
  onUnarchiveList,
  onDeleteListPermanent,
  onUnarchiveCard,
  onDeleteCardPermanent,
  isActivityOpen,
  onCloseActivity,
  activityMember,
  activityLogs,
  isActivityLoading,
}) => {
  return (
    <>
      {topToast && typeof document !== 'undefined'
        ? createPortal(
          <div className="board-top-toast" role="status" aria-live="polite">
            {topToast}
          </div>,
          document.body
        )
        : null}
      <div className={`board-detail-page ${isTouch ? 'is-touch' : ''} ${isListDragging ? 'drag-list-active' : ''}`} style={backgroundStyle}>
        <BoardHeader
          board={board}
          boardTitle={boardTitle}
          canEditBoard={canEditBoard}
          onBoardTitleChange={onBoardTitleChange}
          onBoardTitleBlur={onBoardTitleBlur}
          onToggleFavorite={onToggleFavorite}
          boardIconSrc={boardIconSrc}
          boardIconLetter={boardIconLetter}
          boardIconFailed={boardIconFailed}
          onBoardIconError={onBoardIconError}
          isGlobalMenuOpen={isGlobalMenuOpen}
          onToggleGlobalMenu={onToggleGlobalMenu}
          onCloseGlobalMenu={onCloseGlobalMenu}
          onLogout={onLogout}
          headerMembers={headerMembers}
          visibleMembers={visibleMembers}
          extraMembersCount={extraMembersCount}
          headerMemberId={headerMemberId}
          onToggleHeaderMember={onToggleHeaderMember}
          onCloseHeaderMember={onCloseHeaderMember}
          getAvatarSrc={getAvatarSrc}
          fallbackAvatar={fallbackAvatar}
          getMemberDisplayName={getMemberDisplayName}
          canManageMembers={canManageMembers}
          ownerId={ownerId}
          currentUserId={currentUserId}
          onOpenMemberActivity={onOpenMemberActivity}
          onToggleMemberRole={onToggleMemberRole}
          onRemoveMember={onRemoveMember}
          filterQuery={filterQuery}
          onSearchChange={onSearchChange}
          onOpenFilter={onOpenFilter}
          onOpenMenu={onOpenMenu}
          onOpenMembersPanel={onOpenMembersPanel}
          closeSignal={closeSignal}
        />

        <DragDropContext
          key={dragDropContextKey}
          onBeforeCapture={onBeforeCapture}
          onBeforeDragStart={onBeforeDragStart}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        >
          <Droppable droppableId="board-drop-zone" direction="horizontal" type="list">
            {(provided) => (
              <div
                className="board-canvas"
                ref={(node) => {
                  boardCanvasRef.current = node;
                  provided.innerRef(node);
                }}
                {...provided.droppableProps}
              >
                {filteredLists.map((list: List, index: number) => (
                  <BoardColumn
                    key={list.id}
                    list={list}
                    index={index}
                    listIndex={index}
                    listOptions={listOptions}
                    prevList={index > 0 ? filteredLists[index - 1] : null}
                    nextList={index < filteredLists.length - 1 ? filteredLists[index + 1] : null}
                    isTouch={isTouch}
                    canEditList={canEditBoard && !isListMovePending}
                    canAddCards={canAddCardToList(list)}
                    canEditCard={canEditCard}
                    onAddCard={onAddCard}
                    onUpdateList={onUpdateList}
                    onDeleteList={onDeleteList}
                    onCopyList={onCopyList}
                    onArchiveAllCards={onArchiveAllCards}
                    onCardClick={onCardOpen}
                    onToggleCardComplete={onToggleCardComplete}
                    listMenuOpen={openListMenuId !== null && openListMenuId === list.id}
                    onToggleListMenu={onToggleListMenu}
                    onCloseListMenu={onCloseListMenu}
                    isCollapsed={collapsedLists.includes(list.id)}
                    onToggleCollapse={onToggleCollapse}
                    onMoveList={onMoveList}
                    onMoveCard={onMoveCard}
                  />
                ))}
                {provided.placeholder}

                {canCreateList && (
                  <div className="add-list-wrapper">
                    {isAddingList ? (
                      <form onSubmit={onCreateList}>
                        <input name="listTitle" className="form-input" autoFocus placeholder={t('list.create.placeholder')} value={newListTitle} onChange={(e) => onNewListTitleChange(e.target.value)} style={{ marginBottom: 8, background: 'var(--bg-input)' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button type="submit" size="sm" variant="primary">{t('list.create.submit')}</Button>
                          <button type="button" onClick={onCloseAddList} className="btn-secondary btn-sm" style={{ width: 'auto', background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }} aria-label={t('common.close')}>
                            <FiX aria-hidden="true" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button className="btn-add-list" onClick={onOpenAddList}>{t('list.addButton')}</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {selectedCard && (
          <CardModal
            card={selectedCard}
            board={board}
            isOpen={!!selectedCard}
            onClose={onCloseCardModal}
            onCopyLink={onCopyCardLink}
            onUpdateCard={onUpdateSelectedCard}
            onDeleteCard={onDeleteCard}
            onCopyCard={onCopyCard}
            onMoveCard={onMoveCard}
            onAddChecklist={onAddChecklist}
            onDeleteChecklist={onDeleteChecklist}
            onAddChecklistItem={onAddChecklistItem}
            onDeleteChecklistItem={onDeleteChecklistItem}
            onToggleChecklistItem={onToggleChecklistItem}
            onUpdateChecklistItem={onUpdateChecklistItem}
            onAddComment={onAddComment}
            onUpdateComment={onUpdateComment}
            onDeleteComment={onDeleteComment}
            onUpdateLabels={onUpdateCardLabels}
            onCreateLabel={onCreateLabel}
            onUpdateLabel={onUpdateLabel}
            onDeleteLabel={onDeleteLabel}
            onJoinCard={onJoinCard}
            onLeaveCard={onLeaveCard}
            onRemoveMember={onRemoveCardMember}
            onAddMember={onAddCardMember}
            onAddAttachment={onAddAttachment}
            onDeleteAttachment={onDeleteAttachment}
          />
        )}

        <BoardFiltersModal
          isOpen={isFilterOpen}
          onClose={onCloseFilter}
          filterQuery={filterQuery}
          onSearchChange={onSearchChange}
          filterMemberId={filterMemberId}
          onMemberChange={onFilterMemberChange}
          filterLabelId={filterLabelId}
          onLabelChange={onFilterLabelChange}
          filterDue={filterDue}
          onDueChange={onFilterDueChange}
          filterCompleted={filterCompleted}
          onCompletedChange={onFilterCompletedChange}
          members={board.members || []}
          labels={labels || []}
          onReset={onResetFilters}
        />

        <BoardMenuSidebar
          isOpen={isMenuOpen}
          onClose={onCloseSidebar}
          activeTab={activeMenuTab}
          onTabChange={onTabChange}
          board={board}
          inviteLink={inviteLink}
          onInvite={onInvite}
          canEditBoard={canEditBoard}
          canManageMembers={canManageMembers}
          canLeaveBoard={canLeaveBoard}
          isOwner={isOwner}
          onArchiveToggle={onArchiveToggle}
          onDeleteBoard={onDeleteBoard}
          onLeaveBoard={onLeaveBoard}
          onLogout={onLogout}
          onUpdateBoardSettings={onUpdateBoardSettings}
          colorOptions={colorOptions}
          gradientOptions={gradientOptions}
          imageOptions={imageOptions}
          bgUrlInput={bgUrlInput}
          onBgUrlInputChange={onBgUrlInputChange}
          onBackgroundSelect={onBackgroundSelect}
          onBackgroundFile={onBackgroundFile}
          memberQuery={memberQuery}
          onMemberQueryChange={onMemberQueryChange}
          filteredMembers={filteredMembers}
          activeMemberId={activeMemberId}
          onToggleActiveMember={onToggleActiveMember}
          getMemberDisplayName={getMemberDisplayName}
          getAvatarSrc={getAvatarSrc}
          fallbackAvatar={fallbackAvatar}
          onOpenMemberActivity={onOpenMemberActivity}
          onToggleMemberRole={onToggleMemberRole}
          onRemoveMember={onRemoveMember}
          currentUserId={currentUserId}
          archivedLists={archivedLists}
          archivedCards={archivedCards}
          onUnarchiveList={onUnarchiveList}
          onDeleteList={onDeleteListPermanent}
          onUnarchiveCard={onUnarchiveCard}
          onDeleteCard={onDeleteCardPermanent}
        />

        <Link to="/help" className="board-floating-help" aria-label={t('nav.help')} title={t('nav.help')}>
          <FiHelpCircle aria-hidden="true" />
        </Link>

        <BoardActivityModal
          isOpen={isActivityOpen}
          onClose={onCloseActivity}
          activityMember={activityMember}
          activityLogs={activityLogs}
          isLoading={isActivityLoading}
        />
      </div>
    </>
  );
};
