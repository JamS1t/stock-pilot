import React from "react";

export interface SheetStatusState {
  success?: string | null;
  error?: string | null;
  loading?: string | null;
}

interface SheetStatusProps extends SheetStatusState {
  className?: string;
}

const SheetStatus: React.FC<SheetStatusProps> = ({
  success,
  error,
  loading,
  className = "",
}) => {
  const message = error || loading || success;
  if (!message) return null;

  const tone = error
    ? "border-danger/30 bg-danger-tint text-danger"
    : loading
      ? "border-line-strong bg-sunken text-muted"
      : "border-peso/30 bg-peso-tint text-peso-deep";

  return (
    <div className={`rounded-xl border px-3.5 py-3 text-sm ${tone} ${className}`}>
      {message}
    </div>
  );
};

export default SheetStatus;
