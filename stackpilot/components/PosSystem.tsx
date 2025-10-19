import React, { useState } from "react";
import { OrderItem } from "../utils/api"; // Import OrderItem from API utils
import { TrashIcon, XMarkIcon } from "./icons";
import PaymentModal from "./PaymentModal";
import { useFormatters } from "../format";

type DiscountType = "percentage" | "fixed";

interface PosSystemProps {
  cart: OrderItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void; // Changed productId to number
  onRemoveFromCart: (productId: number) => void; // Changed productId to number
  onClearCart: () => void;
  onCreateOrder: (payload: {
    items: Omit<OrderItem, "product_name">[]; // Adjusted to match API payload
    total_amount: number; // Adjusted to match API payload
    payment_method: string; // Adjusted to match API payload
  }) => void;
}

const PosSystem: React.FC<PosSystemProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCreateOrder,
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { formatCurrency } = useFormatters();

  const subtotal = cart.reduce(
    (acc, item) =>
      acc +
      (isNaN(item.price_at_sale) ? 0 : item.price_at_sale) *
        (item.quantity || 0), // Use price_at_sale
    0
  );

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * (discount || 0)) / 100;
  } else {
    discountAmount = discount || 0;
  }

  const total = subtotal - discountAmount;

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (value >= 0) {
      if (discountType === "percentage" && value > 100) {
        value = 100;
      }
      setDiscount(value);
    } else if (e.target.value === "") {
      setDiscount(0);
    }
  };

  const handleCreateOrder = (paymentMethod: string) => {
    if (isCreatingOrder) return;

    setIsCreatingOrder(true);
    try {
      const itemsPayload = cart.map(
        ({
          product_id,
          product_name,
          price_at_sale,
          quantity,
          category_id,
        }) => ({
          product_id,
          name: product_name, // ✅ required by stored procedure
          price: price_at_sale, // ✅ rename for backend
          quantity,
          category_id,
        })
      );

      const payload = {
        sub_total: subtotal,
        tax: 0,
        total,
        discount,
        discount_amount: discountAmount,
        discount_type: discountType,
        payment_method: paymentMethod,
        items: itemsPayload,
      };

      onCreateOrder(payload); // ✅ send the same structure backend expects
      setIsPaymentModalOpen(false);
      setDiscount(0);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <aside className="w-96 bg-gray-800/50 flex flex-col p-4 border-l border-gray-700">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Current Order</h2>
        <button
          onClick={() => {
            onClearCart();
            setDiscount(0);
          }}
          disabled={cart.length === 0}
          className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          <XMarkIcon className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No items in cart</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li
                key={item.product_id} // Use product_id as key
                className="flex items-center space-x-3 bg-gray-700/50 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {item.product_name}
                  </p>{" "}
                  {/* Use product_name */}
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.price_at_sale)}{" "}
                    {/* Use price_at_sale */}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      onUpdateQuantity(
                        item.product_id, // Use product_id
                        isNaN(value) ? 1 : value <= 0 ? 1 : value
                      );
                    }}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value) || value < 0) {
                        onUpdateQuantity(item.product_id, 1); // Use product_id
                      } else {
                        onUpdateQuantity(item.product_id, value); // Use product_id
                      }
                    }}
                    min="1"
                    className="w-14 bg-gray-800 text-center rounded-md py-1 border border-gray-600 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <button
                    onClick={() => onRemoveFromCart(item.product_id)} // Use product_id
                    className="p-1.5 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/10"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-auto pt-4 border-t border-gray-700 space-y-3">
        <div className="flex justify-between text-sm text-gray-300">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-300">
          <label htmlFor="discount" className="flex-shrink-0">
            Discount
          </label>
          <div className="flex items-center space-x-1">
            <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg p-0.5">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`px-2 py-0.5 text-xs rounded-md ${
                  discountType === "percentage"
                    ? "bg-sky-500 text-white"
                    : "text-gray-400"
                }`}
              >
                %
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`px-2 py-0.5 text-xs rounded-md ${
                  discountType === "fixed"
                    ? "bg-sky-500 text-white"
                    : "text-gray-400"
                }`}
              >
                ₱
              </button>
            </div>
            <input
              type="number"
              id="discount"
              value={discount || ""}
              onChange={handleDiscountChange}
              placeholder="0"
              min="0"
              max={discountType === "percentage" ? 100 : undefined}
              className="w-20 bg-gray-700 text-right rounded-md py-1 border border-gray-600 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Discount Amount</span>
            <span>- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold text-white">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          disabled={cart.length === 0}
          className="w-full bg-sky-500 text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
        >
          Proceed to Payment
        </button>
      </footer>
      {isPaymentModalOpen && (
        <PaymentModal
          total={total}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirmPayment={handleCreateOrder}
        />
      )}
    </aside>
  );
};

export default PosSystem;
