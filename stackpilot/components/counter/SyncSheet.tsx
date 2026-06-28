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
  onDiscard,
}) => (
  <Sheet
    isOpen={isOpen}
    onClose={onClose}
    eyebrow="Sync"
    title={isOnline ? "Online" : "Offline - saving locally"}
  >
    <SheetStatus {...status} className="mb-3" />
    <div className="grid grid-cols-3 gap-2 text-center">
      {([
        ["Queued", queueSummary.queued],
        ["Failed", queueSummary.failed],
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
      disabled={isSubmitting || (!queueSummary.queued && !queueSummary.failed) || !isOnline}
      className="btn btn-ghost mt-3 w-full"
    >
      {isSubmitting ? "Retrying sync..." : "Retry sync"}
    </button>
    {failedItems.length > 0 && (
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-ink">Failed sync items</h3>
        {failedItems.map((item) => (
          <div key={item.local_id} className="rounded-xl border border-danger/20 bg-danger-tint p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-danger">
                  {item.entity_type} {item.operation_type}
                </p>
                <p className="mt-1 text-xs text-danger">
                  {item.last_error || "Sync failed."}
                </p>
                <p className="mt-1 text-[0.65rem] text-muted">
                  Attempts: {item.attempts}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDiscard(item.local_id)}
                disabled={isSubmitting}
                className="btn btn-ghost px-3"
              >
                Discard
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </Sheet>
);

export default SyncSheet;
