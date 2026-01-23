import { useState, useEffect, useCallback } from 'react';
import { Board } from '../../../types'; // Було ../../types
import * as api from '../api';

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getBoards();
      setBoards(data);
    } catch (err) {
      setError('Failed to fetch boards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBoard = async (title: string) => {
    try {
      const newBoard = await api.createBoard(title);
      setBoards(prev => [...prev, newBoard]);
      return newBoard;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return { boards, isLoading, error, fetchBoards, addBoard };
};