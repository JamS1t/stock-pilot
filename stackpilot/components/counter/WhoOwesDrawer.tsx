import React, { useState } from "react";
import Sheet from "../Sheet";
import { WhoOwesCustomer } from "../../utils/api";
import SheetStatus, { SheetStatusState } from "./SheetStatus";

interface WhoOwesDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  whoOwes: WhoOwesCustomer[];
  formatCurrency: (n: number) => string;
  paymentCustomerId: string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentNote: string;
  setPaymentNote: (v: string) => void;
  setPaymentCustomerId: (v: string) => void;
  status: SheetStatusState;
  isSubmitting: boolean;
  onRecordPayment: () => void;
}

const WhoOwesDrawer: React.FC<WhoOwesDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
  whoOwes,
  formatCurrency,
  paymentCustomerId,
  paymentAmount,
  setPaymentAmount,
  paymentNote,
  setPaymentNote,
  setPaymentCustomerId,
  status,
  isSubmitting,
  onRecordPayment,
}) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const sorted = [...whoOwes].sort((a, b) => Number(b.balance) - Number(a.balance));

  const selectPerson = (id: number) => {
    setOpenId(id);
    setPaymentCustomerId(String(id));
  };

  return (
    <>
      {whoOwes.length > 0 && (
        <button
          type="button"
          onClick={onOpen}
          className="btn btn-utang fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 shadow-pop sm:right-5"
        >
          Sino may utang? · {whoOwes.length}
        </button>
      )}

      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        variant="drawer"
        eyebrow="Suki ledger"
        title="Sino may utang"
      >
        <SheetStatus {...status} className="mb-3" />
        {sorted.length === 0 ? (
          <p className="text-sm text-muted">Walang open na utang. Lahat bayad.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((customer) => (
              <div key={customer.customer_id} className="rounded-xl border border-line">
                <button
                  type="button"
                  onClick={() => selectPerson(customer.customer_id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left"
                >
                  <span className="truncate text-sm text-ink">{customer.name}</span>
                  <span className="money text-sm font-bold text-utang">
                    {formatCurrency(customer.balance)}
                  </span>
                </button>

                {openId === customer.customer_id && (
                  <div className="space-y-2 border-t border-line p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(customer.balance))}
                        className="btn btn-ghost btn-sm"
                      >
                        Exact
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(Number(customer.balance) / 2))}
                        className="btn btn-ghost btn-sm"
                      >
                        Half
                      </button>
                    </div>
                    <input
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder={`Bayad ${formatCurrency(customer.balance)}`}
                      inputMode="decimal"
                      className="field field-sm"
                    />
                    <input
                      value={paymentNote}
                      onChange={(event) => setPaymentNote(event.target.value)}
                      placeholder="Note (optional)"
                      className="field field-sm"
                    />
                    <button
                      type="button"
                      onClick={onRecordPayment}
                      disabled={
                        !Number.isFinite(Number(paymentAmount)) ||
                        Number(paymentAmount) <= 0 ||
                        paymentCustomerId !== String(customer.customer_id) ||
                        isSubmitting
                      }
                      className="btn btn-primary w-full"
                    >
                      Record bayad
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
};

export default WhoOwesDrawer;
