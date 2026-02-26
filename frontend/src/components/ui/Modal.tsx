import React, { useId, useRef } from 'react';
import { FiX } from 'shared/ui/fiIcons';
import { useI18n } from '../../context/I18nContext';
import { useDialogA11y } from '../../shared/hooks/useDialogA11y';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, contentClassName }) => {
  const { t } = useI18n();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  useDialogA11y({ isOpen, onClose, dialogRef: modalRef });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`modal-content ${contentClassName || ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}>
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
