import { reorderActiveListsById } from './helpers';

type TestList = {
  id: number;
  title: string;
  order: number;
  is_archived: boolean;
};

const makeList = (id: number, order: number, isArchived = false): TestList => ({
  id,
  title: `List ${id}`,
  order,
  is_archived: isArchived,
});

describe('reorderActiveListsById', () => {
  test('reorders only active lists and keeps archived slots untouched', () => {
    const lists = [
      makeList(1, 1, false),
      makeList(2, 2, true),
      makeList(3, 3, false),
      makeList(4, 4, false),
      makeList(5, 5, true),
    ];

    const changed = reorderActiveListsById(lists as never[], 4, 0);

    expect(changed).toBe(true);
    expect(lists.map((list) => list.id)).toEqual([4, 2, 1, 3, 5]);
    expect(lists.filter((list) => !list.is_archived).map((list) => list.order)).toEqual([1, 2, 3]);
    expect(lists[1].is_archived).toBe(true);
    expect(lists[4].is_archived).toBe(true);
  });
});
