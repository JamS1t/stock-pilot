import React, { useEffect, useState } from "react";
import { getOrderInvoice } from "../utils/api";
import { formatCurrency } from "../format";

interface InvoiceModalProps {
  orderId?: number;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ orderId, onClose }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg">
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg">
          <p className="text-red-400">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-sky-600 rounded-md hover:bg-sky-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg">
          <p>No invoice found.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-sky-600 rounded-md hover:bg-sky-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { header, items, totals } = invoice;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
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

      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 invoice-container print-bg-white">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <img src="/stockpilot-logo.png" alt="Logo" width="40" />
                <h1 className="text-2xl font-bold text-white tracking-tight print-text-black">
                  Stock<span className="text-sky-400">Pilot</span>
                </h1>
              </div>
              <p className="text-sm text-gray-400 print-text-gray">
                Invoice #{header?.invoice_number ?? orderId}
              </p>
              <p className="text-sm text-gray-400 print-text-gray">
                Date: {new Date(header?.date).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold text-white print-text-black">
                RECEIPT
              </h2>
            </div>
          </div>

          {/* Items Table */}
          <div className="max-h-60 overflow-y-auto border-t border-b border-gray-600 print-border-gray py-2 my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600 print-border-gray">
                  <th className="text-left font-semibold text-white print-text-black py-2">
                    Item
                  </th>
                  <th className="text-center font-semibold text-white print-text-black py-2">
                    Qty
                  </th>
                  <th className="text-right font-semibold text-white print-text-black py-2">
                    Price
                  </th>
                  <th className="text-right font-semibold text-white print-text-black py-2">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 text-gray-300 print-text-gray">
                      {item.item}
                    </td>
                    <td className="text-center py-2 text-gray-300 print-text-gray">
                      {item.qty}
                    </td>
                    <td className="text-right py-2 text-gray-300 print-text-gray">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="text-right py-2 text-gray-300 print-text-gray">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400 print-text-gray">
              <span>Subtotal</span>
              <span>{formatCurrency(totals?.subtotal ?? 0)}</span>
            </div>
            {totals?.discount > 0 && (
              <div className="flex justify-between text-gray-400 print-text-gray">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-white pt-2 border-t border-gray-600 print-text-black print-border-gray">
              <span>Total</span>
              <span>{formatCurrency(totals?.total ?? 0)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6 print-text-gray">
            Thank you for your business!
          </p>
        </div>

        {/* Buttons */}
        <div className="bg-gray-700/50 p-4 flex justify-end space-x-3 rounded-b-xl no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
