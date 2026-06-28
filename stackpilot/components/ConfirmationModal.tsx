import React from 'react';

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md animate-fade-in p-6 shadow-pop"
        onClick={e => e.stopPropagation()}
      >
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
      </div>
    </div>
  );
};

export default ConfirmationModal;
