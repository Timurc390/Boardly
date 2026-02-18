import { clampNumber, getEdgeAutoScrollDelta, parseEntityId } from './dragAutoScroll';

describe('dragAutoScroll utilities', () => {
  it('clamps numbers into range', () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clampNumber(-3, 0, 10)).toBe(0);
    expect(clampNumber(99, 0, 10)).toBe(10);
  });

  it('returns negative delta near start edge', () => {
    const delta = getEdgeAutoScrollDelta(10, 0, 300, 80, 4, 20);
    expect(delta).toBeLessThan(0);
  });

  it('returns positive delta near end edge', () => {
    const delta = getEdgeAutoScrollDelta(295, 0, 300, 80, 4, 20);
    expect(delta).toBeGreaterThan(0);
  });

  it('returns zero in safe center area', () => {
    const delta = getEdgeAutoScrollDelta(150, 0, 300, 80, 4, 20);
    expect(delta).toBe(0);
  });

  it('parses entity id by prefix', () => {
    expect(parseEntityId('card-42', 'card-')).toBe(42);
    expect(parseEntityId('list-7', 'list-')).toBe(7);
    expect(parseEntityId('card-42', 'list-')).toBeNull();
    expect(parseEntityId('card-xx', 'card-')).toBeNull();
  });
});
