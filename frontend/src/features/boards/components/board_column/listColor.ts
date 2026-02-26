export const LIST_COLOR_OPTIONS = [
  '#4CAF50',
  '#FBC02D',
  '#E53935',
  '#1E88E5',
  '#9E9E9E',
  '#F5F5F5',
  '#FB8C00',
  '#8E24AA',
  '#00897B',
  '#8D6E63',
];

const hexToRgb = (hex: string) => {
  const raw = hex.replace('#', '').trim();
  if (!raw) return null;
  const normalized = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ] as const;
};

export const getHeaderColorMeta = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isLight = luminance > 0.6;
  return {
    text: isLight ? '#1f2937' : '#f8fafc',
    badgeBg: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
    divider: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)',
  };
};
