import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BoardDetailContent } from './components/BoardDetailContent';
import { useI18n } from '../../context/I18nContext';
import { Card, List } from '../../types';
import { useOverlayManager } from './hooks/useOverlayManager';
import { useBoardPolling } from './hooks/useBoardPolling';
import { useBoardTouchLayout } from './hooks/useBoardTouchLayout';
import { useBoardFilters } from './hooks/useBoardFilters';
import { useBoardDnD } from './hooks/useBoardDnD';
import { useBoardActionRunner } from './hooks/useBoardActionRunner';
import { useBoardCardActions } from './hooks/useBoardCardActions';
import { useBoardCardModalActions } from './hooks/useBoardCardModalActions';
import { useBoardListActions } from './hooks/useBoardListActions';
import { useBoardInvite } from './hooks/useBoardInvite';
import { useBoardMemberActivity } from './hooks/useBoardMemberActivity';
import { useBoardMembers } from './hooks/useBoardMembers';
import { useBoardBackgrounds } from './hooks/useBoardBackgrounds';
import { useBoardCardSelectionSync } from './hooks/useBoardCardSelectionSync';
import { useBoardPresentation } from './hooks/useBoardPresentation';
import { useBoardScreenCallbacks } from './hooks/useBoardScreenCallbacks';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectBoardDerivedByUser } from '../../store/selectors/boardSelectors';
import { 
  fetchBoardById, 
  updateBoardAction, 
  clearCurrentBoard,
} from '../../store/slices/boardSlice';

export const BoardDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  const { user } = useAppSelector(state => state.auth);
  const { currentBoard: board, loading: isLoading, error, isLive } = useAppSelector(state => state.board);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [activeMenuTab, setActiveMenuTab] = useState<'main' | 'background' | 'members' | 'archived' | 'permissions'>('main');
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [collapsedLists, setCollapsedLists] = useState<number[]>([]);
  const [isListMovePending, setIsListMovePending] = useState(false);
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [boardIconFailed, setBoardIconFailed] = useState(false);
  const boardCanvasRef = useRef<HTMLDivElement | null>(null);
  const {
    isMenuOpen,
    isFilterOpen,
    isGlobalMenuOpen,
    openListMenuId,
    headerMemberId,
    headerOverlayCloseSignal,
    isActivityOpen,
    closeTransientOverlays,
    toggleGlobalMenu,
    closeGlobalMenu,
    toggleListMenu,
    closeListMenu,
    toggleHeaderMember,
    closeHeaderMember,
    openSidebar,
    closeSidebar,
    openFilter,
    closeFilter,
    openActivity,
    closeActivity,
    prepareHeaderMembersPanel
  } = useOverlayManager();

  useEffect(() => {
    if (id) {
      dispatch(fetchBoardById(Number(id)));
    }
    return () => {
      dispatch(clearCurrentBoard());
    };
  }, [id, dispatch]);

  const isTouch = useBoardTouchLayout(board?.id);

  useEffect(() => {
    if (board) setBoardTitle(board.title);
  }, [board]);

  const selectedCardId = selectedCard?.id;

  useEffect(() => {
    closeTransientOverlays();
  }, [board?.id, closeTransientOverlays]);

  useEffect(() => {
    if (!selectedCardId) return;
    closeTransientOverlays();
  }, [closeTransientOverlays, selectedCardId]);

  const {
    boardId,
    isOwner,
    currentMembership,
    canManageMembers,
    canEditBoard,
    canCreateList,
    canLeaveBoard,
    boardCards,
    boardListsById,
    activeLists,
    archivedLists,
    archivedCards,
    isDeveloper,
  } = useAppSelector((state) => selectBoardDerivedByUser(state, user?.id));

  const canAddCardToList = React.useCallback(
    (list: List) => {
      if (canEditBoard) return true;
      if (isDeveloper && board?.dev_can_create_cards && list.allow_dev_add_cards) return true;
      return false;
    },
    [board?.dev_can_create_cards, canEditBoard, isDeveloper]
  );

  const canEditCard = React.useCallback(
    (card: Card) => {
      if (canEditBoard) return true;
      if (isDeveloper && board?.dev_can_edit_assigned_cards && card.members?.some((member) => member.id === user?.id)) {
        return true;
      }
      return false;
    },
    [board?.dev_can_edit_assigned_cards, canEditBoard, isDeveloper, user?.id]
  );

  useBoardCardSelectionSync({
    board,
    boardCards,
    selectedCard,
    setSelectedCard,
    locationSearch: location.search,
  });

  const {
    filterQuery,
    filterMemberId,
    setFilterMemberId,
    filterLabelId,
    setFilterLabelId,
    filterDue,
    setFilterDue,
    filterCompleted,
    setFilterCompleted,
    filteredLists,
    listOptions,
    resetFilters,
  } = useBoardFilters({ activeLists, locationSearch: location.search });

  const runBoardAction = useBoardActionRunner({ dispatch, fallbackMessage: t('common.actionFailed') });
  const fallbackAvatar = '/logo.png';
  const {
    memberQuery,
    setMemberQuery,
    activeMemberId,
    setActiveMemberId,
    getAvatarSrc,
    getMemberDisplayName,
    headerMembers,
    visibleMembers,
    extraMembersCount,
    filteredMembers,
    handleToggleMemberRole,
    handleLeaveBoard,
  } = useBoardMembers({
    board,
    canManageMembers,
    currentMembership,
    dispatch,
    navigateToBoards: () => navigate('/boards'),
    profileFallbackLabel: t('nav.profile'),
    fallbackAvatar,
  });
  const { inviteLink, topToast, showTopToast, handleInvite } = useBoardInvite({
    inviteToken: board?.invite_link,
    copyPromptText: t('prompt.copyLink'),
    linkCopiedText: t('common.linkCopied'),
    inviteTitle: t('board.menu.inviteTitle'),
  });
  const {
    activityMember,
    activityLogs,
    isActivityLoading,
    openMemberActivity,
    closeMemberActivity,
  } = useBoardMemberActivity({ boardId, openActivity, closeActivity });
  const { handleUpdateSelectedCard, handleUpdateCardLabels, handleCardOpen } = useBoardCardActions({
    dispatch,
    boardIdParam: id,
    selectedCard,
    setSelectedCard,
    boardLabels: board?.labels || [],
    runBoardAction,
    actionFailedMessage: t('common.actionFailed'),
    closeTransientOverlays,
  });
  const {
    handleCreateList,
    handleAddCard,
    handleUpdateList,
    handleDeleteList,
    handleCopyList,
    handleArchiveAllCardsInList,
    handleToggleCardComplete,
    handleTitleBlur,
    handleMoveList,
    handleMoveCard,
    toggleListCollapse,
  } = useBoardListActions({
    dispatch,
    t,
    boardId,
    board,
    boardTitle,
    boardListsById,
    boardCards,
    filteredListsLength: filteredLists.length,
    canCreateList,
    canEditBoard,
    canEditCard,
    canAddCardToList,
    newListTitle,
    setNewListTitle,
    setIsAddingList,
    setCollapsedLists,
    isListMovePending,
    setIsListMovePending,
  });
  const { dragDropContextKey, isAnyDragRef, isListDragging, onBeforeCapture, onBeforeDragStart, onDragStart, onDragUpdate, onDragEnd } = useBoardDnD({
    onMoveList: handleMoveList,
    onMoveCard: handleMoveCard,
    closeTransientOverlays,
  });
  useBoardPolling({ boardIdParam: id, isLive, isAnyDragRef, dispatch });
  const {
    handleCloseCardModal,
    handleCopyCardLink,
    handleDeleteCard,
    handleCopyCard,
    handleAddChecklist,
    handleDeleteChecklist,
    handleAddChecklistItem,
    handleDeleteChecklistItem,
    handleToggleChecklistItem,
    handleUpdateChecklistItem,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleCreateLabel,
    handleUpdateLabel,
    handleDeleteLabel,
    handleJoinCard,
    handleLeaveCard,
    handleRemoveCardMember,
    handleAddCardMember,
    handleAddAttachment,
    handleDeleteAttachment,
  } = useBoardCardModalActions({
    boardId,
    selectedCard,
    setSelectedCard,
    runBoardAction,
    showTopToast,
    t,
    handleUpdateSelectedCard,
    handleUpdateCardLabels,
    handleMoveCard,
  });

  const { backgroundStyle, boardIconSrc, boardIconLetter } = useBoardPresentation({ board });
  const {
    updateSearch,
    handleToggleFavorite,
    handleOpenFilter,
    handleOpenMenuMain,
    handleArchiveToggle,
    handleDeleteBoard,
    handleUpdateBoardSettings,
    handleLogout,
    handleRemoveMember,
    handleUnarchiveList,
    handleDeleteListPermanent,
    handleUnarchiveCard,
    handleDeleteCardPermanent,
  } = useBoardScreenCallbacks({
    dispatch,
    navigate,
    pathname: location.pathname,
    search: location.search,
    boardId,
    isBoardArchived: !!board?.is_archived,
    openFilter,
    openSidebar,
    setActiveMenuTab,
    deleteBoardConfirmText: t('board.deleteConfirm'),
  });

  const { colorOptions, gradientOptions, imageOptions, handleBackgroundSelect, handleBackgroundFile } =
    useBoardBackgrounds({
      boardId,
      t,
      onUpdateBoard: (data) => dispatch(updateBoardAction({ id: boardId, data })),
    });

  if (isLoading && !board) return <div className="loading-state">{t('common.loading')}</div>;
  if (error) return <div className="error-state">{t('board.error.loadDetails')}</div>;
  if (!board) return null;

  return (
    <BoardDetailContent
      topToast={topToast}
      isTouch={isTouch}
      isListDragging={isListDragging}
      backgroundStyle={backgroundStyle}
      board={board}
      boardTitle={boardTitle}
      canEditBoard={canEditBoard}
      onBoardTitleChange={setBoardTitle}
      onBoardTitleBlur={handleTitleBlur}
      onToggleFavorite={handleToggleFavorite}
      boardIconSrc={boardIconSrc}
      boardIconLetter={boardIconLetter}
      boardIconFailed={boardIconFailed}
      onBoardIconError={() => setBoardIconFailed(true)}
      isGlobalMenuOpen={isGlobalMenuOpen}
      onToggleGlobalMenu={toggleGlobalMenu}
      onCloseGlobalMenu={closeGlobalMenu}
      onLogout={handleLogout}
      headerMembers={headerMembers}
      visibleMembers={visibleMembers}
      extraMembersCount={extraMembersCount}
      headerMemberId={headerMemberId}
      onToggleHeaderMember={toggleHeaderMember}
      onCloseHeaderMember={closeHeaderMember}
      getAvatarSrc={getAvatarSrc}
      fallbackAvatar={fallbackAvatar}
      getMemberDisplayName={getMemberDisplayName}
      canManageMembers={canManageMembers}
      ownerId={board.owner?.id}
      currentUserId={user?.id}
      onOpenMemberActivity={openMemberActivity}
      onToggleMemberRole={handleToggleMemberRole}
      onRemoveMember={handleRemoveMember}
      filterQuery={filterQuery}
      onSearchChange={updateSearch}
      onOpenFilter={handleOpenFilter}
      onOpenMenu={handleOpenMenuMain}
      onOpenMembersPanel={prepareHeaderMembersPanel}
      closeSignal={headerOverlayCloseSignal}
      dragDropContextKey={dragDropContextKey}
      onBeforeCapture={onBeforeCapture}
      onBeforeDragStart={onBeforeDragStart}
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      boardCanvasRef={boardCanvasRef}
      filteredLists={filteredLists}
      listOptions={listOptions}
      canAddCardToList={canAddCardToList}
      canEditCard={canEditCard}
      onAddCard={handleAddCard}
      onUpdateList={handleUpdateList}
      onDeleteList={handleDeleteList}
      onCopyList={handleCopyList}
      onArchiveAllCards={handleArchiveAllCardsInList}
      onCardOpen={handleCardOpen}
      onToggleCardComplete={handleToggleCardComplete}
      openListMenuId={openListMenuId}
      onToggleListMenu={toggleListMenu}
      onCloseListMenu={closeListMenu}
      collapsedLists={collapsedLists}
      onToggleCollapse={toggleListCollapse}
      onMoveList={handleMoveList}
      onMoveCard={handleMoveCard}
      isListMovePending={isListMovePending}
      canCreateList={canCreateList}
      isAddingList={isAddingList}
      onCreateList={handleCreateList}
      newListTitle={newListTitle}
      onNewListTitleChange={setNewListTitle}
      onOpenAddList={() => setIsAddingList(true)}
      onCloseAddList={() => setIsAddingList(false)}
      t={t}
      selectedCard={selectedCard}
      onCloseCardModal={handleCloseCardModal}
      onCopyCardLink={handleCopyCardLink}
      onUpdateSelectedCard={handleUpdateSelectedCard}
      onDeleteCard={handleDeleteCard}
      onCopyCard={handleCopyCard}
      onAddChecklist={handleAddChecklist}
      onDeleteChecklist={handleDeleteChecklist}
      onAddChecklistItem={handleAddChecklistItem}
      onDeleteChecklistItem={handleDeleteChecklistItem}
      onToggleChecklistItem={handleToggleChecklistItem}
      onUpdateChecklistItem={handleUpdateChecklistItem}
      onAddComment={handleAddComment}
      onUpdateComment={handleUpdateComment}
      onDeleteComment={handleDeleteComment}
      onUpdateCardLabels={handleUpdateCardLabels}
      onCreateLabel={handleCreateLabel}
      onUpdateLabel={handleUpdateLabel}
      onDeleteLabel={handleDeleteLabel}
      onJoinCard={handleJoinCard}
      onLeaveCard={handleLeaveCard}
      onRemoveCardMember={handleRemoveCardMember}
      onAddCardMember={handleAddCardMember}
      onAddAttachment={handleAddAttachment}
      onDeleteAttachment={handleDeleteAttachment}
      isFilterOpen={isFilterOpen}
      onCloseFilter={closeFilter}
      filterMemberId={filterMemberId}
      onFilterMemberChange={setFilterMemberId}
      filterLabelId={filterLabelId}
      onFilterLabelChange={setFilterLabelId}
      filterDue={filterDue}
      onFilterDueChange={setFilterDue}
      filterCompleted={filterCompleted}
      onFilterCompletedChange={setFilterCompleted}
      labels={board.labels}
      onResetFilters={resetFilters}
      isMenuOpen={isMenuOpen}
      onCloseSidebar={closeSidebar}
      activeMenuTab={activeMenuTab}
      onTabChange={setActiveMenuTab}
      inviteLink={inviteLink}
      onInvite={handleInvite}
      canLeaveBoard={canLeaveBoard}
      isOwner={isOwner}
      onArchiveToggle={handleArchiveToggle}
      onDeleteBoard={handleDeleteBoard}
      onLeaveBoard={handleLeaveBoard}
      onUpdateBoardSettings={handleUpdateBoardSettings}
      colorOptions={colorOptions}
      gradientOptions={gradientOptions}
      imageOptions={imageOptions}
      bgUrlInput={bgUrlInput}
      onBgUrlInputChange={setBgUrlInput}
      onBackgroundSelect={handleBackgroundSelect}
      onBackgroundFile={handleBackgroundFile}
      memberQuery={memberQuery}
      onMemberQueryChange={setMemberQuery}
      filteredMembers={filteredMembers}
      activeMemberId={activeMemberId}
      onToggleActiveMember={setActiveMemberId}
      archivedLists={archivedLists}
      archivedCards={archivedCards}
      onUnarchiveList={handleUnarchiveList}
      onDeleteListPermanent={handleDeleteListPermanent}
      onUnarchiveCard={handleUnarchiveCard}
      onDeleteCardPermanent={handleDeleteCardPermanent}
      isActivityOpen={isActivityOpen}
      onCloseActivity={closeMemberActivity}
      activityMember={activityMember}
      activityLogs={activityLogs}
      isActivityLoading={isActivityLoading}
    />
  );
};
