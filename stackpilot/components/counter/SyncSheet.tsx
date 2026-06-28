import React from "react";
import Sheet from "../Sheet";
import { SyncQueueSummary } from "../../offline/syncQueue";
import SheetStatus, { SheetStatusState } from "./SheetStatus";

interface SyncSheetProps {
  isOpen: boolean;
  onClose: () => void;
  queueSummary: SyncQueueSummary;
  isOnline: boolean;
  status: SheetStatusState;
  isSubmitting: boolean;
  onRetry: () => void;
}

const SyncSheet: React.FC<SyncSheetProps> = ({
  isOpen,
  onClose,
  queueSummary,
  isOnline,
  status,
  isSubmitting,
  onRetry,
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
  </Sheet>
);

export default SyncSheet;
