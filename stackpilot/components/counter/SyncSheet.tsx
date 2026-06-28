import React from "react";
import Sheet from "../Sheet";
import { SyncQueueItem, SyncQueueSummary } from "../../offline/syncQueue";
import SheetStatus, { SheetStatusState } from "./SheetStatus";

interface SyncSheetProps {
  isOpen: boolean;
  onClose: () => void;
  queueSummary: SyncQueueSummary;
  isOnline: boolean;
  status: SheetStatusState;
  isSubmitting: boolean;
  failedItems: SyncQueueItem[];
  onRetry: () => void;
  onRefreshAndRetry: () => void;
  onReview: (item: SyncQueueItem) => void;
  onDiscard: (localId: string) => void;
}

const SyncSheet: React.FC<SyncSheetProps> = ({
  isOpen,
  onClose,
  queueSummary,
  isOnline,
  status,
  isSubmitting,
  failedItems,
  onRetry,
  onRefreshAndRetry,
  onReview,
  onDiscard,
}) => {
  const hasRetryableConflict = failedItems.some(
    (item) => item.status === "conflict" && item.conflict?.retryable
  );

  const getReviewLabel = (item: SyncQueueItem) => {
    switch (item.conflict?.kind) {
      case "missing_product":
      case "insufficient_stock":
        return "Review inventory";
      case "missing_customer":
      case "duplicate_customer":
        return "Review ledger";
      case "invalid_payload":
      case "server_rejected":
        return "Review details";
      default:
        return item.status === "conflict" ? "Review" : null;
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Sync"
      title={isOnline ? "Online" : "Offline - saving locally"}
    >
    <SheetStatus {...status} className="mb-3" />
    <div className="grid grid-cols-4 gap-2 text-center">
      {([
        ["Queued", queueSummary.queued],
        ["Failed", queueSummary.failed],
        ["Conflicts", queueSummary.conflict],
        ["Synced", queueSummary.synced],
      ] as const).map(([label, value]) => (
        <div key={label} className="card-sunken py-2.5">
          <p className="money text-lg font-bold text-ink">{value}</p>
          <p className="text-[0.65rem] font-medium text-muted">{label}</p>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={onRetry}
      disabled={
        isSubmitting ||
        (!queueSummary.queued && !queueSummary.failed && !hasRetryableConflict) ||
        !isOnline
      }
      className="btn btn-ghost mt-3 w-full"
    >
      {isSubmitting ? "Retrying sync..." : "Retry sync"}
    </button>
    {hasRetryableConflict && (
      <button
        type="button"
        onClick={onRefreshAndRetry}
        disabled={isSubmitting || !isOnline}
        className="btn btn-primary mt-2 w-full"
      >
        Refresh data and retry conflicts
      </button>
    )}
    {failedItems.length > 0 && (
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-ink">Sync items needing attention</h3>
        {failedItems.map((item) => {
          const reviewLabel = getReviewLabel(item);
          const canRefreshAndRetry =
            item.status === "conflict" && item.conflict?.retryable;
          const canDiscard =
            item.status !== "conflict" || item.conflict?.resolution === "discard";

          return (
            <div key={item.local_id} className="rounded-xl border border-danger/20 bg-danger-tint p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-danger">
                      {item.status === "conflict" ? "Conflict" : "Failed"} -{" "}
                      {item.entity_type} {item.operation_type}
                    </p>
                    <p className="mt-1 text-xs text-danger">
                      {item.conflict?.message || item.last_error || "Sync failed."}
                    </p>
                  </div>
                  {item.conflict && (
                    <span className="pill pill-warn flex-shrink-0">
                      {item.conflict.kind.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                {item.conflict?.server_snapshot && (
                  <p className="mt-2 truncate text-[0.65rem] text-muted">
                    Server: {JSON.stringify(item.conflict.server_snapshot)}
                  </p>
                )}
                {item.conflict && (
                  <p className="mt-1 text-[0.65rem] text-muted">
                    Suggested: {item.conflict.resolution.replace(/_/g, " ")}
                  </p>
                )}
                <p className="mt-1 text-[0.65rem] text-muted">
                  Attempts: {item.attempts}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewLabel && (
                    <button
                      type="button"
                      onClick={() => onReview(item)}
                      disabled={isSubmitting}
                      className="btn btn-ghost btn-sm"
                    >
                      {reviewLabel}
                    </button>
                  )}
                  {canRefreshAndRetry && (
                    <button
                      type="button"
                      onClick={onRefreshAndRetry}
                      disabled={isSubmitting || !isOnline}
                      className="btn btn-primary btn-sm"
                    >
                      Refresh and retry
                    </button>
                  )}
                  {canDiscard && (
                    <button
                      type="button"
                      onClick={() => onDiscard(item.local_id)}
                      disabled={isSubmitting}
                      className="btn btn-ghost btn-sm"
                    >
                      Discard
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
    </Sheet>
  );
};

export default SyncSheet;
