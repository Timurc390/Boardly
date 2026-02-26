import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  deleteBoardAction,
  deleteCardAction,
  deleteListAction,
  removeBoardMemberAction,
  toggleFavoriteAction,
  updateBoardAction,
  updateCardAction,
  updateListAction,
} from '../../../store/slices/boardSlice';
import { logoutUser } from '../../../store/slices/authSlice';
import { AppDispatch } from '../../../store/store';
import { confirmAction } from '../../../shared/utils/confirm';

type UseBoardScreenCallbacksOptions = {
  dispatch: AppDispatch;
  navigate: NavigateFunction;
  pathname: string;
  search: string;
  boardId: number;
  isBoardArchived: boolean;
  openFilter: () => void;
  openSidebar: () => void;
  setActiveMenuTab: (tab: 'main' | 'background' | 'members' | 'archived' | 'permissions') => void;
  deleteBoardConfirmText: string;
};

export const useBoardScreenCallbacks = ({
  dispatch,
  navigate,
  pathname,
  search,
  boardId,
  isBoardArchived,
  openFilter,
  openSidebar,
  setActiveMenuTab,
  deleteBoardConfirmText,
}: UseBoardScreenCallbacksOptions) => {
  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(search);
      if (value) params.set('q', value);
      else params.delete('q');
      navigate({ pathname, search: params.toString() }, { replace: true });
    },
    [navigate, pathname, search]
  );

  const handleToggleFavorite = useCallback(() => {
    if (!boardId) return;
    dispatch(toggleFavoriteAction(boardId));
  }, [boardId, dispatch]);

  const handleOpenFilter = useCallback(() => {
    openFilter();
  }, [openFilter]);

  const handleOpenMenuMain = useCallback(() => {
    openSidebar();
    setActiveMenuTab('main');
  }, [openSidebar, setActiveMenuTab]);

  const handleArchiveToggle = useCallback(() => {
    if (!boardId) return;
    dispatch(updateBoardAction({ id: boardId, data: { is_archived: !isBoardArchived } }));
  }, [boardId, dispatch, isBoardArchived]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardId) return;
    if (!confirmAction(deleteBoardConfirmText)) return;
    await dispatch(deleteBoardAction(boardId));
    navigate('/boards');
  }, [boardId, deleteBoardConfirmText, dispatch, navigate]);

  const handleUpdateBoardSettings = useCallback(
    (data: Parameters<typeof updateBoardAction>[0]['data']) => {
      if (!boardId) return;
      dispatch(updateBoardAction({ id: boardId, data }));
    },
    [boardId, dispatch]
  );

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const handleRemoveMember = useCallback(
    (membershipId: number) => {
      dispatch(removeBoardMemberAction(membershipId));
    },
    [dispatch]
  );

  const handleUnarchiveList = useCallback(
    (listId: number) => {
      dispatch(updateListAction({ listId, data: { is_archived: false } }));
    },
    [dispatch]
  );

  const handleDeleteListPermanent = useCallback(
    (listId: number) => {
      dispatch(deleteListAction(listId));
    },
    [dispatch]
  );

  const handleUnarchiveCard = useCallback(
    (cardId: number) => {
      dispatch(updateCardAction({ cardId, data: { is_archived: false } }));
    },
    [dispatch]
  );

  const handleDeleteCardPermanent = useCallback(
    (cardId: number) => {
      dispatch(deleteCardAction(cardId));
    },
    [dispatch]
  );

  return {
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
  };
};
