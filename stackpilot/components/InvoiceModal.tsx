import React, { useEffect, useState } from "react";
import { getOrderInvoice } from "../utils/api";
import { useFormatters } from "../format";

interface InvoiceModalProps {
  orderId?: number;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ orderId, onClose }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { formatCurrency, formatLocalDate } = useFormatters();

  if (!orderId) return null;

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getOrderInvoice({ id: orderId });

        let raw: any = response?.data ?? null;
        if (Array.isArray(raw) && raw.length > 0) raw = raw[0];
        setInvoice(raw);
      } catch (err: any) {
        // console.error("Failed to fetch invoice:", err);
        setError(err.message || "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
        <div className="card p-6 shadow-pop">
          <p className="text-sm text-muted">Loading resibo…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
        <div className="card p-6 shadow-pop">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={onClose}
            className="btn btn-ghost mt-4"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
        <div className="card p-6 shadow-pop">
          <p className="text-sm text-muted">Walang nahanap na resibo.</p>
          <button
            onClick={onClose}
            className="btn btn-ghost mt-4"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { header, items, totals } = invoice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      {/* ✅ Print Styles */}
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
            color: #4A5568 !important; /* gray-700 */
          }
          .print-border-gray {
            border-color: #E2E8F0 !important; /* gray-200 */
          }
        }
        `}
      </style>

      <div className="card w-full max-w-lg shadow-pop animate-fade-in invoice-container print-bg-white">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
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

          {/* Items Table */}
          <div className="max-h-60 overflow-y-auto border-t border-b border-line print-border-gray py-2 my-4">
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
                  <tr key={idx} className="border-b border-line/60 print-border-gray last:border-0">
                    <td className="py-2 text-ink print-text-gray">
                      {item.item}
                    </td>
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

          {/* Totals */}
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
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-line-strong print-text-black print-border-gray">
              <span className="font-display text-base font-semibold text-ink">Total</span>
              <span className="money text-2xl font-bold text-peso">{formatCurrency(totals?.total ?? 0)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-faint mt-6 print-text-gray">
            Salamat sa pagtangkilik!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-line bg-sunken p-4 no-print">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
