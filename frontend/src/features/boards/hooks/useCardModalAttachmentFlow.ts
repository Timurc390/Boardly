import { useCallback, useState } from 'react';
import { API_URL } from '../../../api/client';

type UseCardModalAttachmentFlowParams = {
  onAddAttachment: (file: File) => Promise<void> | void;
};

export const useCardModalAttachmentFlow = ({ onAddAttachment }: UseCardModalAttachmentFlowParams) => {
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const handleAttachmentUpload = useCallback(async (file?: File) => {
    if (!file || isUploadingAttachment) return;

    setIsUploadingAttachment(true);
    try {
      await onAddAttachment(file);
    } finally {
      setIsUploadingAttachment(false);
    }
  }, [isUploadingAttachment, onAddAttachment]);

  const resolveApiOrigin = useCallback(() => {
    if (/^https?:\/\//i.test(API_URL)) {
      return new URL(API_URL).origin;
    }

    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }

    return window.location.origin;
  }, []);

  const resolveAttachmentUrl = useCallback((filePath?: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
      return filePath;
    }

    const apiOrigin = resolveApiOrigin();
    if (filePath.startsWith('/')) {
      return `${apiOrigin}${filePath}`;
    }

    return `${apiOrigin}/${filePath.replace(/^\.?\//, '')}`;
  }, [resolveApiOrigin]);

  return {
    isUploadingAttachment,
    handleAttachmentUpload,
    resolveAttachmentUrl,
  };
};
