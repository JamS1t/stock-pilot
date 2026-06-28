import React, { useEffect, useState } from "react";
import Sheet from "../Sheet";
import { Customer, CustomerBalance } from "../../utils/api";
import SheetStatus, { SheetStatusState } from "./SheetStatus";

interface ChargeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  formatCurrency: (n: number) => string;
  customers: Customer[];
  customerBalance: CustomerBalance | null;
  chargeCustomerId: string;
  setChargeCustomerId: (v: string) => void;
  newCustomerName: string;
  setNewCustomerName: (v: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (v: string) => void;
  chargeNote: string;
  setChargeNote: (v: string) => void;
  status: SheetStatusState;
  isSubmitting: boolean;
  onCash: () => void;
  onGcash: () => void;
  onUtang: () => void;
  onCreateCustomer: () => void;
}

const ChargeSheet: React.FC<ChargeSheetProps> = ({
  isOpen,
  onClose,
  subtotal,
  formatCurrency,
  customers,
  customerBalance,
  chargeCustomerId,
  setChargeCustomerId,
  newCustomerName,
  setNewCustomerName,
  newCustomerPhone,
  setNewCustomerPhone,
  chargeNote,
  setChargeNote,
  status,
  isSubmitting,
  onCash,
  onGcash,
  onUtang,
  onCreateCustomer,
}) => {
  const [mode, setMode] = useState<"choose" | "cash" | "gcash" | "utang">("choose");
  const [cashReceived, setCashReceived] = useState("");
  const [gcashReference, setGcashReference] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setMode("choose");
      setCashReceived("");
      setGcashReference("");
    }
  }, [isOpen]);

  const cashAmount = Number(cashReceived || subtotal);
  const hasValidCash = Number.isFinite(cashAmount) && cashAmount >= subtotal;
  const changeDue = Math.max(0, cashAmount - subtotal);

  const close = () => {
    setMode("choose");
    setCashReceived("");
    setGcashReference("");
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={close} eyebrow="Checkout" title={`Charge ${formatCurrency(subtotal)}`}>
      <SheetStatus {...status} className="mb-3" />
      {mode === "choose" ? (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setMode("cash")}
            disabled={subtotal <= 0 || isSubmitting}
            className="btn btn-primary btn-lg w-full justify-between"
          >
            <span>Cash</span>
            <span className="money">{formatCurrency(subtotal)}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("gcash")}
            disabled={subtotal <= 0 || isSubmitting}
            className="btn btn-gcash btn-lg w-full justify-between"
          >
            <span>GCash</span>
            <span className="money">{formatCurrency(subtotal)}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("utang")}
            disabled={subtotal <= 0 || isSubmitting}
            className="btn btn-utang btn-lg w-full justify-between"
          >
            <span>Utang</span>
            <span className="money">{formatCurrency(subtotal)}</span>
          </button>
        </div>
      ) : mode === "cash" ? (
        <div className="space-y-3">
          <div className="card-sunken p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted">Amount due</span>
              <span className="money text-2xl font-bold text-ink">{formatCurrency(subtotal)}</span>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Cash received</span>
            <input
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              placeholder={formatCurrency(subtotal)}
              inputMode="decimal"
              className="field"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3">
            <span className="text-sm font-medium text-muted">Change due</span>
            <span className={`money text-xl font-bold ${hasValidCash ? "text-peso" : "text-danger"}`}>
              {hasValidCash ? formatCurrency(changeDue) : "Short"}
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <button type="button" onClick={() => setMode("choose")} className="btn btn-ghost">
              Back
            </button>
            <button
              type="button"
              onClick={onCash}
              disabled={!hasValidCash || isSubmitting}
              className="btn btn-primary btn-lg"
            >
              Confirm cash sale
            </button>
          </div>
        </div>
      ) : mode === "gcash" ? (
        <div className="space-y-3">
          <div className="card-sunken p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted">Amount due</span>
              <span className="money text-2xl font-bold text-gcash">{formatCurrency(subtotal)}</span>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">GCash reference (optional)</span>
            <input
              value={gcashReference}
              onChange={(event) => setGcashReference(event.target.value)}
              placeholder="Reference number"
              className="field"
            />
          </label>
          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <button type="button" onClick={() => setMode("choose")} className="btn btn-ghost">
              Back
            </button>
            <button
              type="button"
              onClick={onGcash}
              disabled={subtotal <= 0 || isSubmitting}
              className="btn btn-gcash btn-lg"
            >
              Confirm GCash sale
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select
              value={chargeCustomerId}
              onChange={(event) => setChargeCustomerId(event.target.value)}
              className="field"
            >
              <option value="">Pumili ng suki</option>
              {customers.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <div className="flex min-w-[110px] flex-col justify-center rounded-xl border border-line bg-surface px-3 py-1.5 text-right">
              <span className="text-[0.65rem] font-medium text-muted">Balance</span>
              <span className="money text-sm font-bold text-utang">
                {formatCurrency(customerBalance?.balance ?? 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={newCustomerName}
              onChange={(event) => setNewCustomerName(event.target.value)}
              placeholder="New suki name"
              className="field field-sm"
            />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={newCustomerPhone}
                onChange={(event) => setNewCustomerPhone(event.target.value)}
                placeholder="Phone"
                className="field field-sm"
              />
              <button
                type="button"
                onClick={onCreateCustomer}
                disabled={!newCustomerName.trim() || isSubmitting}
                className="btn btn-ghost px-4"
              >
                Add
              </button>
            </div>
          </div>

          <input
            value={chargeNote}
            onChange={(event) => setChargeNote(event.target.value)}
            placeholder="Utang note (optional)"
            className="field field-sm"
          />

          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <button type="button" onClick={() => setMode("choose")} className="btn btn-ghost">
              Back
            </button>
            <button
              type="button"
              onClick={onUtang}
              disabled={!chargeCustomerId || isSubmitting}
              className="btn btn-utang btn-lg"
            >
              Confirm utang {formatCurrency(subtotal)}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
};

export default ChargeSheet;
