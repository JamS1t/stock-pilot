import React from "react";
import Sheet from "../Sheet";
import { CashSession } from "../../utils/api";
import SheetStatus, { SheetStatusState } from "./SheetStatus";

interface CashDrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cashSession: CashSession | null;
  openingCash: string;
  setOpeningCash: (v: string) => void;
  actualCash: string;
  setActualCash: (v: string) => void;
  expectedCash: number;
  todaySales: number;
  owingCount: number;
  formatCurrency: (n: number) => string;
  status: SheetStatusState;
  isSubmitting: boolean;
  onOpenSession: () => void;
  onCloseSession: () => void;
}

const CashDrawerSheet: React.FC<CashDrawerSheetProps> = ({
  isOpen,
  onClose,
  cashSession,
  openingCash,
  setOpeningCash,
  actualCash,
  setActualCash,
  expectedCash,
  todaySales,
  owingCount,
  formatCurrency,
  status,
  isSubmitting,
  onOpenSession,
  onCloseSession,
}) => (
  <Sheet
    isOpen={isOpen}
    onClose={onClose}
    eyebrow="Kahon"
    title={cashSession ? `Cash session · #${cashSession.cash_session_id}` : "Cash session"}
  >
    <SheetStatus {...status} className="mb-4" />
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div className="stat">
        <p className="stat-label">Benta</p>
        <p className="stat-value text-peso">{formatCurrency(todaySales)}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Expected cash</p>
        <p className="stat-value">{formatCurrency(expectedCash)}</p>
      </div>
      <div className="stat">
        <p className="stat-label">May utang</p>
        <p className="stat-value text-utang">{owingCount}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Status</p>
        <p className="stat-value">{cashSession ? "Open" : "Closed"}</p>
      </div>
    </div>

    {cashSession ? (
      <div className="space-y-2">
        {Number.isFinite(Number(actualCash)) && actualCash !== "" && (
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3">
            <span className="text-sm font-medium text-muted">Difference</span>
            <span
              className={`money text-lg font-bold ${
                Number(actualCash) - expectedCash < 0 ? "text-danger" : "text-peso"
              }`}
            >
              {formatCurrency(Number(actualCash) - expectedCash)}
            </span>
          </div>
        )}
        <input
          value={actualCash}
          onChange={(event) => setActualCash(event.target.value)}
          placeholder="Bilang ng cash (actual)"
          inputMode="decimal"
          className="field"
        />
        <button
          type="button"
          onClick={onCloseSession}
          disabled={!Number.isFinite(Number(actualCash)) || Number(actualCash) < 0 || isSubmitting}
          className="btn btn-primary w-full"
        >
          Close cash session
        </button>
      </div>
    ) : (
      <div className="space-y-2">
        <input
          value={openingCash}
          onChange={(event) => setOpeningCash(event.target.value)}
          placeholder="Opening cash"
          inputMode="decimal"
          className="field"
        />
        <button
          type="button"
          onClick={onOpenSession}
          disabled={
            !Number.isFinite(Number(openingCash || 0)) ||
            Number(openingCash || 0) < 0 ||
            isSubmitting
          }
          className="btn btn-primary w-full"
        >
          Start cash session
        </button>
      </div>
    )}
  </Sheet>
);

export default CashDrawerSheet;
