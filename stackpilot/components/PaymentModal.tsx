import React, { useState } from 'react';
import { CashIcon, CreditCardIcon } from './icons';
import { useFormatters } from '../format';

interface PaymentModalProps {
    total: number;
    onClose: () => void;
    onConfirmPayment: (paymentMethod: 'cash' | 'card') => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onConfirmPayment }) => {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

    const { formatCurrency } = useFormatters();

    const handleConfirm = () => {
        onConfirmPayment(paymentMethod);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Confirm Payment</h2>
                <p className="text-5xl font-extrabold text-sky-400 text-center mb-6">{formatCurrency(total)}</p>

                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-400 mb-2 text-center">Select Payment Method</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${paymentMethod === 'cash' ? 'bg-sky-500/20 border-sky-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}
                        >
                            <CashIcon className="w-8 h-8 mb-2"/>
                            <span className="font-semibold">Cash</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('card')}
                             className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${paymentMethod === 'card' ? 'bg-sky-500/20 border-sky-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}
                        >
                             <CreditCardIcon className="w-8 h-8 mb-2"/>
                            <span className="font-semibold">Card</span>
                        </button>
                    </div>
                </div>

                <div className="pt-4 flex flex-col space-y-3">
                    <button 
                        onClick={handleConfirm}
                        className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-all duration-300"
                    >
                        Confirm Transaction
                    </button>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="w-full py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;