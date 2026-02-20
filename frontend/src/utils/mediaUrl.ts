import { API_URL } from '../api/client';

const getApiOrigin = (): string => {
  if (/^https?:\/\//i.test(API_URL)) {
    try {
      return new URL(API_URL).origin;
    } catch {
      // fall through
    }
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return window.location.origin;
  }

  return '';
};

export const resolveMediaUrl = (value?: string | null, fallback = ''): string => {
  const candidate = (value || '').trim();
  if (!candidate) return fallback;
  if (candidate.startsWith('data:')) return candidate;

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    try {
      const url = new URL(candidate);
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.protocol === 'http:') {
        return `https://${url.host}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return candidate;
    }
    return candidate;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return candidate;
  if (candidate.startsWith('/')) return `${apiOrigin}${candidate}`;
  return `${apiOrigin}/${candidate.replace(/^\.?\//, '')}`;
};
