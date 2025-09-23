import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { CashIcon, CreditCardIcon, DocumentDuplicateIcon } from '../components/icons';
import InvoiceModal from '../components/InvoiceModal';
import { formatCurrency } from '../format';

interface OrderHistoryPageProps {
    orders: Order[];
}

const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [orders, searchTerm]);

    const handleViewReceipt = (order: Order) => {
        setViewingOrder(order);
    };

    const handleCloseReceipt = () => {
        setViewingOrder(null);
    };

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Order History</h1>
                <p className="text-gray-400">Review past transactions.</p>
            </header>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="mb-6">
                     <input
                        type="text"
                        placeholder="Search by Order ID or Product Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                </div>
                <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-6 py-3">Order ID</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Items</th>
                                <th scope="col" className="px-6 py-3">Total</th>
                                <th scope="col" className="px-6 py-3 text-center">Payment</th>
                                <th scope="col" className="px-6 py-3 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-mono text-xs text-sky-400">{order.id}</td>
                                    <td className="px-6 py-4">{order.date.toLocaleDateString()} {order.date.toLocaleTimeString()}</td>
                                    <td className="px-6 py-4">{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                                    <td className="px-6 py-4 font-semibold text-white">{formatCurrency(order.total)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            {order.paymentMethod === 'cash' ? <CashIcon className="w-5 h-5"/> : <CreditCardIcon className="w-5 h-5"/>}
                                            <span className="capitalize">{order.paymentMethod}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleViewReceipt(order)}
                                            className="p-2 text-sky-400 rounded-full hover:bg-sky-400/10 transition-colors duration-200"
                                            aria-label="View receipt"
                                        >
                                            <DocumentDuplicateIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {viewingOrder && (
                <InvoiceModal 
                    order={viewingOrder}
                    onClose={handleCloseReceipt}
                />
            )}
        </main>
    );
};

export default OrderHistoryPage;