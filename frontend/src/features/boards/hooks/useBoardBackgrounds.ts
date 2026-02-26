import { useCallback, useMemo } from 'react';
import { validateImageFile } from '../../../shared/utils/fileValidation';

type UseBoardBackgroundsOptions = {
  boardId: number;
  t: (key: string, params?: Record<string, string>) => string;
  onUpdateBoard: (data: { background_url: string }) => void;
};

export const useBoardBackgrounds = ({ boardId, t, onUpdateBoard }: UseBoardBackgroundsOptions) => {
  const defaultBoardBackground = '/board-backgrounds/board-default.jpg';

  const colorOptions = useMemo(
    () => [
      { key: 'default', value: '', label: t('board.background.default'), preview: `url(${defaultBoardBackground})` },
      { key: 'slate', value: '#1f2937', label: t('board.background.slate') },
      { key: 'charcoal', value: '#2c2c2c', label: t('board.background.charcoal') },
      { key: 'indigo', value: '#312e81', label: t('board.background.indigo') },
      { key: 'emerald', value: '#064e3b', label: t('board.background.emerald') },
      { key: 'warmLight', value: '#f5e7d0', label: t('board.background.warmLight') },
    ],
    [defaultBoardBackground, t]
  );

  const gradientOptions = useMemo(
    () => [
      { key: 'sunset', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', label: t('board.background.gradient.sunset') },
      { key: 'ocean', value: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)', label: t('board.background.gradient.ocean') },
      { key: 'forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', label: t('board.background.gradient.forest') },
      { key: 'blush', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', label: t('board.background.gradient.blush') },
      { key: 'night', value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', label: t('board.background.gradient.night') },
      { key: 'dawn', value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)', label: t('board.background.gradient.dawn') },
    ],
    [t]
  );

  const imageOptions = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => {
        const id = String(index + 1).padStart(2, '0');
        return {
          key: `photo-${id}`,
          value: `/board-backgrounds/board-${id}.jpg`,
          label: `${t('board.background.images')} ${id}`,
        };
      }),
    [t]
  );

  const handleBackgroundSelect = useCallback(
    (value: string) => {
      if (!boardId) return;
      onUpdateBoard({ background_url: value });
    },
    [boardId, onUpdateBoard]
  );

  const handleBackgroundFile = useCallback(
    (file?: File | null) => {
      if (!file) return;
      const validation = validateImageFile(file, { maxMb: 4 });
      if (!validation.valid) {
        if (validation.error === 'invalid_type') {
          alert(t('board.background.invalidFile'));
          return;
        }
        if (validation.error === 'too_large') {
          alert(t('board.background.tooLarge', { size: String(validation.maxMb) }));
          return;
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleBackgroundSelect(reader.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [handleBackgroundSelect, t]
  );

  return {
    defaultBoardBackground,
    colorOptions,
    gradientOptions,
    imageOptions,
    handleBackgroundSelect,
    handleBackgroundFile,
  };
};
