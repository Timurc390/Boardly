import { CSSProperties, useMemo } from 'react';
import { Board } from '../../../types';

type UseBoardPresentationOptions = {
  board: Board | null;
};

const DEFAULT_BOARD_BACKGROUND = '/board-backgrounds/board-default.jpg';

export const useBoardPresentation = ({ board }: UseBoardPresentationOptions) => {
  const backgroundValue = board?.background_url || DEFAULT_BOARD_BACKGROUND;

  const backgroundStyle = useMemo(() => {
    const isColorBackground = backgroundValue.startsWith('#');
    const isGradientBackground =
      backgroundValue.startsWith('linear-gradient') || backgroundValue.startsWith('radial-gradient');

    return {
      backgroundColor: isColorBackground ? backgroundValue : undefined,
      backgroundImage:
        !isColorBackground && backgroundValue
          ? isGradientBackground
            ? backgroundValue
            : `url(${backgroundValue})`
          : undefined,
      backgroundSize: !isColorBackground && backgroundValue && !isGradientBackground ? 'cover' : undefined,
      backgroundPosition:
        !isColorBackground && backgroundValue && !isGradientBackground ? 'center' : undefined,
      backgroundRepeat:
        !isColorBackground && backgroundValue && !isGradientBackground ? 'no-repeat' : undefined,
    } as CSSProperties;
  }, [backgroundValue]);

  const boardIconSrc = '/logo.png';
  const boardIconLetter = board?.title?.trim()?.charAt(0).toUpperCase() || 'B';

  return {
    backgroundStyle,
    boardIconSrc,
    boardIconLetter,
  };
};
