import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, List } from '../../../types';

type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'no_due';
type CompletedFilter = 'all' | 'completed' | 'incomplete';

type UseBoardFiltersOptions = {
  activeLists: List[];
  locationSearch: string;
};

export const useBoardFilters = ({ activeLists, locationSearch }: UseBoardFiltersOptions) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<number | ''>('');
  const [filterLabelId, setFilterLabelId] = useState<number | ''>('');
  const [filterDue, setFilterDue] = useState<DueFilter>('all');
  const [filterCompleted, setFilterCompleted] = useState<CompletedFilter>('all');

  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    const q = params.get('q') || '';
    setFilterQuery(q);
  }, [locationSearch]);

  const matchesFilters = useCallback(
    (card: Card) => {
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        const title = card.title?.toLowerCase() || '';
        const desc = card.description?.toLowerCase() || '';
        if (!title.includes(q) && !desc.includes(q)) return false;
      }
      if (filterMemberId && !card.members?.some((member) => member.id === filterMemberId)) return false;
      if (filterLabelId && !card.labels?.some((label) => label.id === filterLabelId)) return false;
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
    },
    [filterCompleted, filterDue, filterLabelId, filterMemberId, filterQuery]
  );

  const isFiltering = !!(
    filterQuery ||
    filterMemberId ||
    filterLabelId ||
    filterDue !== 'all' ||
    filterCompleted !== 'all'
  );

  const filteredLists = useMemo(() => {
    if (!isFiltering) return activeLists;
    return activeLists.map((list) => ({
      ...list,
      cards: (list.cards || []).filter((card) => !card.is_archived && matchesFilters(card)),
    }));
  }, [activeLists, isFiltering, matchesFilters]);

  const listOptions = useMemo(
    () => filteredLists.map((item) => ({ id: item.id, title: item.title })),
    [filteredLists]
  );

  const resetFilters = useCallback(() => {
    setFilterMemberId('');
    setFilterLabelId('');
    setFilterDue('all');
    setFilterCompleted('all');
  }, []);

  return {
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
  };
};
