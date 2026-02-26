import { Board } from '../../../types';

export interface BoardState {
  boards: Board[];
  boardsLoading: boolean;
  boardsError: string | null;
  currentBoard: Board | null;
  loading: boolean;
  error: string | null;
  isLive: boolean;
  activeBoardFetchRequestId: string | null;
}

export const initialBoardState: BoardState = {
  boards: [],
  boardsLoading: false,
  boardsError: null,
  currentBoard: null,
  loading: false,
  error: null,
  isLive: false,
  activeBoardFetchRequestId: null,
};
