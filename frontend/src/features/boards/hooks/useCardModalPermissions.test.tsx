import { renderHook } from '@testing-library/react';
import { useCardModalPermissions } from './useCardModalPermissions';
import { type Board, type Card } from '../../../types';

const makeBoard = (): Board => ({
  id: 1,
  title: 'Board',
  owner: { id: 10, username: 'owner', email: 'owner@test.dev' },
  members: [
    { id: 100, user: { id: 20, username: 'dev', email: 'dev@test.dev' }, role: 'developer' },
    { id: 101, user: { id: 30, username: 'viewer', email: 'viewer@test.dev' }, role: 'viewer' },
  ],
  dev_can_edit_assigned_cards: true,
  dev_can_archive_assigned_cards: true,
  dev_can_join_card: true,
});

const makeCard = (): Card => ({
  id: 7,
  title: 'Card',
  order: 1,
  list: 2,
  board: 1,
  card_color: '#216e4e',
  cover_size: 'full',
  members: [{ id: 20, username: 'dev', email: 'dev@test.dev' }],
});

describe('useCardModalPermissions', () => {
  it('allows owner to manage and edit card', () => {
    const { result } = renderHook(() => useCardModalPermissions(makeCard(), makeBoard(), 10));

    expect(result.current.isOwner).toBe(true);
    expect(result.current.canEditCard).toBe(true);
    expect(result.current.canDeleteCard).toBe(true);
    expect(result.current.canManageMembers).toBe(true);
    expect(result.current.quickActionsDisabled).toBe(false);
  });

  it('allows developer to edit only assigned card with flags enabled', () => {
    const { result } = renderHook(() => useCardModalPermissions(makeCard(), makeBoard(), 20));

    expect(result.current.isDeveloper).toBe(true);
    expect(result.current.isCardMember).toBe(true);
    expect(result.current.canEditCard).toBe(true);
    expect(result.current.canArchiveCard).toBe(true);
    expect(result.current.canDeleteCard).toBe(false);
  });

  it('keeps viewer read-only and maps colorblind cover colors', () => {
    const { result } = renderHook(() => useCardModalPermissions(makeCard(), makeBoard(), 30));

    expect(result.current.isViewer).toBe(true);
    expect(result.current.canEditCard).toBe(false);
    expect(result.current.quickActionsDisabled).toBe(true);
    expect(result.current.resolveCoverColor('#216e4e', true)).toBe('#1d70b8');
  });
});
