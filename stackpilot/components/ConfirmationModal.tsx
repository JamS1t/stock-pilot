import React from 'react';
import DialogFrame from './DialogFrame';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <DialogFrame onClose={onCancel} overlayClassName="z-[60]">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-ghost">
          {cancelText}
        </button>
        <button onClick={onConfirm} className={`btn ${confirmButtonClass}`}>
          {confirmText}
        </button>
      </div>
    </DialogFrame>
  );
};

export default ConfirmationModal;
