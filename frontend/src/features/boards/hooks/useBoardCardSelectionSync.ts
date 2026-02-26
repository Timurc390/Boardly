import { Dispatch, SetStateAction, useEffect } from 'react';
import { Board, Card } from '../../../types';

type UseBoardCardSelectionSyncOptions = {
  board: Board | null;
  boardCards: Card[];
  selectedCard: Card | null;
  setSelectedCard: Dispatch<SetStateAction<Card | null>>;
  locationSearch: string;
};

export const useBoardCardSelectionSync = ({
  board,
  boardCards,
  selectedCard,
  setSelectedCard,
  locationSearch,
}: UseBoardCardSelectionSyncOptions) => {
  const selectedCardId = selectedCard?.id;

  useEffect(() => {
    if (!selectedCardId) return;
    const foundCard = boardCards.find((card) => card.id === selectedCardId);
    if (foundCard) {
      setSelectedCard(foundCard);
    }
  }, [boardCards, selectedCardId, setSelectedCard]);

  useEffect(() => {
    if (!board) return;
    const params = new URLSearchParams(locationSearch);
    const cardId = params.get('card');
    if (!cardId) return;
    const foundCard = boardCards.find((card) => card.id === Number(cardId));
    if (foundCard) setSelectedCard(foundCard);
  }, [board, boardCards, locationSearch, setSelectedCard]);

  return {
    selectedCardId,
  };
};
