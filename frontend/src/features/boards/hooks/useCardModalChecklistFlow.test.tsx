import { act, renderHook } from '@testing-library/react';
import { useCardModalChecklistFlow } from './useCardModalChecklistFlow';
import { type Card } from '../../../types';

const makeCard = (): Card => ({
  id: 1,
  title: 'Card',
  order: 1,
  list: 1,
  board: 1,
  checklists: [
    {
      id: 12,
      title: 'Source',
      items: [
        { id: 201, text: 'A', is_checked: true, order: 1 },
        { id: 202, text: 'B', is_checked: false, order: 2 },
      ],
    },
  ],
});

describe('useCardModalChecklistFlow', () => {
  it('creates checklist and copies items including checked state', async () => {
    jest.useFakeTimers();

    const onAddChecklist = jest.fn(async () => ({ id: 99 }));
    const onAddChecklistItem = jest
      .fn()
      .mockResolvedValueOnce({ id: 301 })
      .mockResolvedValueOnce({ id: 302 });
    const onToggleChecklistItem = jest.fn(async () => undefined);
    const setActivePopover = jest.fn();
    const scrollToChecklists = jest.fn();

    const { result } = renderHook(() =>
      useCardModalChecklistFlow({
        card: makeCard(),
        onAddChecklist,
        onAddChecklistItem,
        onToggleChecklistItem,
        setActivePopover,
        scrollToChecklists,
        defaultChecklistTitle: 'Checklist',
      })
    );

    act(() => {
      result.current.setChecklistCopyFromId(12);
      result.current.setNewChecklistTitle('New title');
    });

    await act(async () => {
      await result.current.handleCreateChecklist();
    });

    expect(onAddChecklist).toHaveBeenCalledWith('New title');
    expect(onAddChecklistItem).toHaveBeenNthCalledWith(1, 99, 'A');
    expect(onAddChecklistItem).toHaveBeenNthCalledWith(2, 99, 'B');
    expect(onToggleChecklistItem).toHaveBeenCalledWith(301, true);
    expect(setActivePopover).toHaveBeenCalledWith(null);

    act(() => {
      jest.runAllTimers();
    });
    expect(scrollToChecklists).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
