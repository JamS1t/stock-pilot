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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="card w-full max-w-md p-6 shadow-pop animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <p className="eyebrow text-center">Bayad</p>
                <h2 className="mt-1 text-center font-display text-2xl font-bold text-ink">
                    Confirm payment
                </h2>
                <p className="money mt-3 mb-6 text-center text-5xl font-bold text-peso">
                    {formatCurrency(total)}
                </p>

                <div className="mb-6">
                    <p className="mb-2.5 text-center text-sm font-medium text-muted">
                        Pumili ng bayad
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border-2 transition ${
                                paymentMethod === 'cash'
                                    ? 'border-peso bg-peso-tint text-peso-deep'
                                    : 'border-line bg-surface text-muted hover:border-line-strong'
                            }`}
                        >
                            <CashIcon className="h-7 w-7" />
                            <span className="text-sm font-semibold">Cash</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border-2 transition ${
                                paymentMethod === 'card'
                                    ? 'border-gcash bg-gcash-tint text-gcash'
                                    : 'border-line bg-surface text-muted hover:border-line-strong'
                            }`}
                        >
                            <CreditCardIcon className="h-7 w-7" />
                            <span className="text-sm font-semibold">Card</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`btn btn-lg w-full ${
                            paymentMethod === 'card'
                                ? 'bg-gcash text-white hover:brightness-110'
                                : 'btn-primary'
                        }`}
                    >
                        Confirm sale
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost w-full"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
