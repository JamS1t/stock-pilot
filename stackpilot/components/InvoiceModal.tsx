import React, { useEffect, useState } from "react";
import { getOrderInvoice } from "../utils/api";
import { useFormatters } from "../format";
import DialogFrame from "./DialogFrame";

interface InvoiceModalProps {
  orderId?: number;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ orderId, onClose }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState<string | null>(null);

  const { formatCurrency, formatLocalDate } = useFormatters();

  useEffect(() => {
    if (!orderId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getOrderInvoice({ id: orderId });
        let raw: any = response?.data ?? null;
        if (Array.isArray(raw) && raw.length > 0) raw = raw[0];
        setInvoice(raw);
      } catch (err: any) {
        setError(err.message || "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  if (!orderId) return null;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DialogFrame onClose={onClose}>
        <p className="text-sm text-muted">Loading resibo...</p>
      </DialogFrame>
    );
  }

  if (error) {
    return (
      <DialogFrame onClose={onClose}>
        <p className="text-sm text-danger">{error}</p>
        <button onClick={onClose} className="btn btn-ghost mt-4">
          Close
        </button>
      </DialogFrame>
    );
  }

  if (!invoice) {
    return (
      <DialogFrame onClose={onClose}>
        <p className="text-sm text-muted">Walang nahanap na resibo.</p>
        <button onClick={onClose} className="btn btn-ghost mt-4">
          Close
        </button>
      </DialogFrame>
    );
  }

  const { header, items, totals } = invoice;

  return (
    <DialogFrame
      onClose={onClose}
      maxWidth="max-w-lg"
      className="invoice-container print-bg-white"
    >
      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border: none;
            box-shadow: none;
            color: black !important;
            background: white !important;
          }
          .no-print {
            display: none;
          }
          .print-bg-white {
            background-color: white !important;
          }
          .print-text-black {
            color: black !important;
          }
          .print-text-gray {
            color: #4A5568 !important;
          }
          .print-border-gray {
            border-color: #E2E8F0 !important;
          }
        }
        `}
      </style>

      <div className="p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center space-x-3">
              <img src="/stockpilot-logo.png" alt="Logo" width="40" />
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink print-text-black">
                Stock<span className="text-peso">Pilot</span>
              </h1>
            </div>
            <p className="text-sm text-muted print-text-gray">
              Resibo #{header?.invoice_number ?? orderId}
            </p>
            <p className="text-sm text-muted print-text-gray">
              Date: {formatLocalDate(header?.date)}
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow print-text-gray">Resibo</p>
          </div>
        </div>

        <div className="my-4 max-h-60 overflow-y-auto border-y border-line py-2 print-border-gray">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line print-border-gray">
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted print-text-black">
                  Item
                </th>
                <th className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted print-text-black">
                  Qty
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted print-text-black">
                  Price
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted print-text-black">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item: any, idx: number) => (
                <tr
                  key={idx}
                  className="border-b border-line/60 last:border-0 print-border-gray"
                >
                  <td className="py-2 text-ink print-text-gray">{item.item}</td>
                  <td className="money py-2 text-center text-muted print-text-gray">
                    {item.qty}
                  </td>
                  <td className="money py-2 text-right text-muted print-text-gray">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="money py-2 text-right text-ink print-text-gray">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted print-text-gray">
            <span>Subtotal</span>
            <span className="money">{formatCurrency(totals?.subtotal ?? 0)}</span>
          </div>
          {totals?.discount > 0 && (
            <div className="flex justify-between text-muted print-text-gray">
              <span>Discount</span>
              <span className="money">-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-line-strong pt-3 print-border-gray print-text-black">
            <span className="font-display text-base font-semibold text-ink">
              Total
            </span>
            <span className="money text-2xl font-bold text-peso">
              {formatCurrency(totals?.total ?? 0)}
            </span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-faint print-text-gray">
          Salamat sa pagtangkilik!
        </p>
      </div>

      <div className="no-print flex justify-end gap-3 rounded-b-2xl border-t border-line bg-sunken p-4">
        <button onClick={onClose} className="btn btn-ghost">
          Close
        </button>
        <button onClick={handlePrint} className="btn btn-primary">
          Print
        </button>
      </div>
    </DialogFrame>
  );
};

export default InvoiceModal;
