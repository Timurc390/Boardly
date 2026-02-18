import { useCallback, useState } from 'react';

export interface OverlayCloseOptions {
  keepGlobal?: boolean;
  keepList?: boolean;
  keepSidebar?: boolean;
  keepFilter?: boolean;
  keepHeaderMember?: boolean;
  keepActivity?: boolean;
}

export const useOverlayManager = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGlobalMenuOpen, setIsGlobalMenuOpen] = useState(false);
  const [openListMenuId, setOpenListMenuId] = useState<number | null>(null);
  const [headerMemberId, setHeaderMemberId] = useState<number | null>(null);
  const [headerOverlayCloseSignal, setHeaderOverlayCloseSignal] = useState(0);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const closeTransientOverlays = useCallback((options: OverlayCloseOptions = {}) => {
    if (!options.keepGlobal) setIsGlobalMenuOpen(false);
    if (!options.keepList) setOpenListMenuId(null);
    if (!options.keepSidebar) setIsMenuOpen(false);
    if (!options.keepFilter) setIsFilterOpen(false);
    if (!options.keepHeaderMember) {
      setHeaderMemberId(null);
      setHeaderOverlayCloseSignal(prev => prev + 1);
    }
    if (!options.keepActivity) setIsActivityOpen(false);
  }, []);

  const toggleGlobalMenu = useCallback(() => {
    if (isGlobalMenuOpen) {
      setIsGlobalMenuOpen(false);
      return;
    }
    closeTransientOverlays({ keepGlobal: true });
    setIsGlobalMenuOpen(true);
  }, [closeTransientOverlays, isGlobalMenuOpen]);

  const closeGlobalMenu = useCallback(() => {
    setIsGlobalMenuOpen(false);
  }, []);

  const toggleListMenu = useCallback((listId: number) => {
    if (!Number.isFinite(listId)) {
      setOpenListMenuId(null);
      return;
    }
    if (openListMenuId === listId) {
      setOpenListMenuId(null);
      return;
    }
    closeTransientOverlays({ keepList: true });
    setOpenListMenuId(listId);
  }, [closeTransientOverlays, openListMenuId]);

  const closeListMenu = useCallback(() => {
    setOpenListMenuId(null);
  }, []);

  const toggleHeaderMember = useCallback((id: number | null) => {
    if (id === null || headerMemberId === id) {
      setHeaderMemberId(null);
      return;
    }
    closeTransientOverlays({ keepHeaderMember: true });
    setHeaderMemberId(id);
  }, [closeTransientOverlays, headerMemberId]);

  const closeHeaderMember = useCallback(() => {
    setHeaderMemberId(null);
  }, []);

  const openSidebar = useCallback(() => {
    closeTransientOverlays({ keepSidebar: true });
    setIsMenuOpen(true);
  }, [closeTransientOverlays]);

  const closeSidebar = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const openFilter = useCallback(() => {
    closeTransientOverlays({ keepFilter: true });
    setIsFilterOpen(true);
  }, [closeTransientOverlays]);

  const closeFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const openActivity = useCallback(() => {
    closeTransientOverlays({ keepActivity: true });
    setIsActivityOpen(true);
  }, [closeTransientOverlays]);

  const closeActivity = useCallback(() => {
    setIsActivityOpen(false);
  }, []);

  const prepareHeaderMembersPanel = useCallback(() => {
    closeTransientOverlays({ keepHeaderMember: true });
  }, [closeTransientOverlays]);

  return {
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
  };
};
