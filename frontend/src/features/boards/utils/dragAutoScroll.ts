export const clampNumber = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const getEdgeAutoScrollDelta = (
  pointer: number,
  start: number,
  end: number,
  edgeSize = 80,
  minStep = 4,
  maxStep = 28
): number => {
  if (end <= start || edgeSize <= 0 || maxStep <= 0) return 0;
  const safeMinStep = clampNumber(minStep, 1, maxStep);

  if (pointer < start + edgeSize) {
    const distance = start + edgeSize - pointer;
    const ratio = clampNumber(distance / edgeSize, 0, 1);
    return -Math.round(safeMinStep + (maxStep - safeMinStep) * ratio);
  }

  if (pointer > end - edgeSize) {
    const distance = pointer - (end - edgeSize);
    const ratio = clampNumber(distance / edgeSize, 0, 1);
    return Math.round(safeMinStep + (maxStep - safeMinStep) * ratio);
  }

  return 0;
};

export const parseEntityId = (value: string, prefix: string): number | null => {
  if (!value.startsWith(prefix)) return null;
  const raw = Number(value.slice(prefix.length));
  if (!Number.isFinite(raw)) return null;
  return raw;
};
