import { buildOutgoingRealtimePayload, validateRealtimePayloadByAction } from './wsPayloadMapper';

describe('wsPayloadMapper', () => {
  const ACTIONS = {
    MOVE_CARD: 'board/moveCard/fulfilled',
    DELETE_CARD: 'board/deleteCard/fulfilled',
    ADD_CHECKLIST_ITEM: 'board/addChecklistItem/fulfilled',
  } as const;

  it('adds ws_meta for move card payload', () => {
    const payload = buildOutgoingRealtimePayload(
      ACTIONS.MOVE_CARD,
      { id: 5, list: 2 },
      { listId: 3, order: 2 }
    ) as { ws_meta?: { destListId: number; destIndex: number } };

    expect(payload.ws_meta).toEqual({ destListId: 3, destIndex: 1 });
  });

  it('validates known payload by action type', () => {
    const valid = validateRealtimePayloadByAction(
      ACTIONS.DELETE_CARD,
      123
    );
    expect(valid).toBe(true);

    const invalid = validateRealtimePayloadByAction(
      ACTIONS.DELETE_CARD,
      { nope: true }
    );
    expect(invalid).toBe(false);
  });

  it('requires ws_meta for add checklist item', () => {
    const valid = validateRealtimePayloadByAction(
      ACTIONS.ADD_CHECKLIST_ITEM,
      {
        item: { id: 10, text: 'x' },
        ws_meta: { checklistId: 9 },
      }
    );
    expect(valid).toBe(true);

    const invalid = validateRealtimePayloadByAction(
      ACTIONS.ADD_CHECKLIST_ITEM,
      {
        item: { id: 10, text: 'x' },
      }
    );
    expect(invalid).toBe(false);
  });
});
