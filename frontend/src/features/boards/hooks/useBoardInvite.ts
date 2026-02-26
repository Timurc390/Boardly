import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseBoardInviteOptions = {
  inviteToken?: string;
  copyPromptText: string;
  linkCopiedText: string;
  inviteTitle: string;
};

export const useBoardInvite = ({
  inviteToken,
  copyPromptText,
  linkCopiedText,
  inviteTitle,
}: UseBoardInviteOptions) => {
  const [topToast, setTopToast] = useState<string | null>(null);
  const topToastTimerRef = useRef<number | null>(null);

  const inviteLink = useMemo(
    () => (inviteToken ? `${window.location.origin}/invite/${inviteToken}` : ''),
    [inviteToken]
  );

  const showTopToast = useCallback((message: string) => {
    setTopToast(message);
    if (topToastTimerRef.current !== null) {
      window.clearTimeout(topToastTimerRef.current);
    }
    topToastTimerRef.current = window.setTimeout(() => {
      setTopToast(null);
      topToastTimerRef.current = null;
    }, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (topToastTimerRef.current !== null) {
        window.clearTimeout(topToastTimerRef.current);
      }
    };
  }, []);

  const handleCopyInvite = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      showTopToast(linkCopiedText);
    } catch {
      window.prompt(copyPromptText, inviteLink);
    }
  }, [copyPromptText, inviteLink, linkCopiedText, showTopToast]);

  const handleInvite = useCallback(async () => {
    if (!inviteLink) return;
    await handleCopyInvite();
    const shareApi = (navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    }).share;
    if (!shareApi) return;
    try {
      await shareApi({ title: inviteTitle, url: inviteLink });
    } catch {
      // Link is already copied; sharing is optional.
    }
  }, [handleCopyInvite, inviteLink, inviteTitle]);

  return {
    inviteLink,
    topToast,
    showTopToast,
    handleInvite,
  };
};
