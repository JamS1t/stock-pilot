import React from 'react';
import { Order } from '../types';
import { formatCurrency } from '../format';

interface InvoiceModalProps {
    order: Order;
    onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
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
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <img src="/stockpilot-logo.png" alt="Logo" width="40" />
                                <h1 className="text-2xl font-bold text-white tracking-tight print-text-black">Stock<span className="text-sky-400">Pilot</span></h1>
                            </div>
                            <p className="text-sm text-gray-400 print-text-gray">Invoice #{order.id.slice(-6)}</p>
                            <p className="text-sm text-gray-400 print-text-gray">Date: {order.date.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                           <h2 className="text-lg font-semibold text-white print-text-black">RECEIPT</h2>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border-t border-b border-gray-600 print-border-gray py-2 my-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-600 print-border-gray">
                                    <th className="text-left font-semibold text-white print-text-black py-2">Item</th>
                                    <th className="text-center font-semibold text-white print-text-black py-2">Qty</th>
                                    <th className="text-right font-semibold text-white print-text-black py-2">Price</th>
                                    <th className="text-right font-semibold text-white print-text-black py-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-2 text-gray-300 print-text-gray">{item.name}</td>
                                        <td className="text-center py-2 text-gray-300 print-text-gray">{item.quantity}</td>
                                        <td className="text-right py-2 text-gray-300 print-text-gray">{formatCurrency(item.price)}</td>
                                        <td className="text-right py-2 text-gray-300 print-text-gray">{formatCurrency(item.quantity * item.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                         <div className="flex justify-between text-gray-400 print-text-gray">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discountAmount && order.discountAmount > 0 && (
                             <div className="flex justify-between text-gray-400 print-text-gray">
                                <span>
                                    Discount {order.discountType === 'percentage' && `(${order.discount}%)`}
                                </span>
                                <span>- {formatCurrency(order.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-400 print-text-gray">
                            <span>Tax (8%)</span>
                            <span>{formatCurrency(order.tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-white pt-2 border-t border-gray-600 print-text-black print-border-gray">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                     <p className="text-center text-xs text-gray-500 mt-6 print-text-gray">Thank you for your business!</p>
                </div>
                <div className="bg-gray-700/50 p-4 flex justify-end space-x-3 rounded-b-xl no-print">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Close</button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors">Download / Print</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;