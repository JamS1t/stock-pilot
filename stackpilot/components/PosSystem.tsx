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
    <aside className="card flex w-96 flex-col p-4 lg:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Current order
          </h2>
          <p className="text-sm text-muted">
            {cart.length} {cart.length === 1 ? "item" : "items"} in cart
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onClearCart();
            setDiscount(0);
          }}
          disabled={cart.length === 0}
          className="btn btn-ghost px-3"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Clear all</span>
        </button>
      </header>

      <div className="-mr-2 flex-1 overflow-y-auto pr-2">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-center">
            <p className="text-sm font-semibold text-muted">Cart is empty</p>
            <p className="text-xs text-faint">Tap a product to start a sale.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {cart.map((item) => (
              <li
                key={item.product_id} // Use product_id as key
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.product_name}
                  </p>{" "}
                  {/* Use product_name */}
                  <p className="money text-xs text-muted">
                    {formatCurrency(item.price_at_sale)}{" "}
                    {/* Use price_at_sale */}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                    className="field field-sm money w-16 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.product_id)} // Use product_id
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-danger transition hover:bg-danger-tint"
                    aria-label={`Remove ${item.product_name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-auto space-y-3 border-t border-line pt-4">
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="money text-ink">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <label htmlFor="discount" className="flex-shrink-0">
            Discount
          </label>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-xl border border-line bg-sunken p-0.5">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  discountType === "percentage"
                    ? "bg-peso text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  discountType === "fixed"
                    ? "bg-peso text-white"
                    : "text-muted hover:text-ink"
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
              className="field field-sm money w-20 text-right"
            />
          </div>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-peso-deep">
            <span>Discount</span>
            <span className="money">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted">Total</span>
          <span className="money text-3xl font-bold text-ink">
            {formatCurrency(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsPaymentModalOpen(true)}
          disabled={cart.length === 0}
          className="btn btn-primary btn-lg w-full"
        >
          Singilin (proceed to bayad)
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
