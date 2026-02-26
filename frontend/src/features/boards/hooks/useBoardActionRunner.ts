import { useCallback } from 'react';
import { AppDispatch } from '../../../store/store';

type UseBoardActionRunnerOptions = {
  dispatch: AppDispatch;
  fallbackMessage: string;
};

type ErrorRecord = Record<string, unknown>;

export type RunBoardAction = <T = unknown>(action: unknown) => Promise<T | null>;

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === 'object' && value !== null;

const hasUnwrap = (value: unknown): value is { unwrap: () => Promise<unknown> } =>
  isRecord(value) && typeof value.unwrap === 'function';

export const useBoardActionRunner = ({ dispatch, fallbackMessage }: UseBoardActionRunnerOptions) => {
  return useCallback(
    async <T = unknown>(action: unknown): Promise<T | null> => {
      const resolveErrorMessage = (error: unknown): string => {
        const response = isRecord(error) && isRecord(error.response) ? error.response : null;
        const data = response && 'data' in response ? response.data : undefined;
        if (typeof data === 'string' && data.trim()) return data;
        if (isRecord(data) && typeof data.detail === 'string' && data.detail.trim()) return data.detail;
        if (isRecord(data)) {
          const pairs = Object.entries(data)
            .map(([key, value]) => {
              if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
              if (typeof value === 'string') return `${key}: ${value}`;
              return null;
            })
            .filter(Boolean) as string[];
          if (pairs.length) return pairs.join('\n');
        }
        if (isRecord(error) && typeof error.message === 'string') return error.message;
        return fallbackMessage;
      };

      try {
        const dispatchResult = dispatch(action as never);
        if (hasUnwrap(dispatchResult)) {
          return (await dispatchResult.unwrap()) as T;
        }
        return dispatchResult as T;
      } catch (error: unknown) {
        alert(resolveErrorMessage(error));
        return null;
      }
    },
    [dispatch, fallbackMessage]
  );
};
