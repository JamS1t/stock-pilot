import React from "react";

interface DialogFrameProps {
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: string;
  className?: string;
  overlayClassName?: string;
  closeOnBackdrop?: boolean;
}

const DialogFrame: React.FC<DialogFrameProps> = ({
  children,
  onClose,
  maxWidth = "max-w-md",
  className = "p-6",
  overlayClassName = "z-50",
  closeOnBackdrop = true,
}) => {
  const handleBackdropClick = () => {
    if (closeOnBackdrop) onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${overlayClassName} flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm`}
      onClick={handleBackdropClick}
    >
      <div
        className={`card w-full ${maxWidth} animate-fade-in ${className} shadow-pop`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default DialogFrame;
