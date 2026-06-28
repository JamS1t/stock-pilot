import React from "react";
import Sheet from "../Sheet";
import { Product, StockMovementReason } from "../../utils/api";
import SheetStatus, { SheetStatusState } from "./SheetStatus";

interface StockAdjustSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  adjustmentProductId: string;
  setAdjustmentProductId: (v: string) => void;
  adjustmentQty: string;
  setAdjustmentQty: (v: string) => void;
  adjustmentReason: StockMovementReason;
  setAdjustmentReason: (v: StockMovementReason) => void;
  adjustmentNote: string;
  setAdjustmentNote: (v: string) => void;
  formatCurrency: (n: number) => string;
  status: SheetStatusState;
  isSubmitting: boolean;
  onRecord: () => void;
}

const StockAdjustSheet: React.FC<StockAdjustSheetProps> = ({
  isOpen,
  onClose,
  products,
  adjustmentProductId,
  setAdjustmentProductId,
  adjustmentQty,
  setAdjustmentQty,
  adjustmentReason,
  setAdjustmentReason,
  adjustmentNote,
  setAdjustmentNote,
  formatCurrency,
  status,
  isSubmitting,
  onRecord,
}) => {
  const selectedProduct = products.find(
    (product) => String(product.product_id) === adjustmentProductId
  );
  const quantityDelta = Number(adjustmentQty);
  const previewStock =
    selectedProduct && Number.isFinite(quantityDelta)
      ? selectedProduct.stock + quantityDelta
      : null;

  return (
  <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Stock" title="Stock adjustment">
    <SheetStatus {...status} className="mb-3" />
    <div className="space-y-2">
      <select
        value={adjustmentProductId}
        onChange={(event) => setAdjustmentProductId(event.target.value)}
        className="field"
      >
        <option value="">Select product</option>
        {products.map((product) => (
          <option key={product.product_id} value={product.product_id}>
          {product.name}
          </option>
        ))}
      </select>
      {selectedProduct && (
        <div className="card-sunken flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {selectedProduct.name}
            </p>
            <p className="text-xs text-muted">
              {formatCurrency(selectedProduct.selling_price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted">Stock after</p>
            <p
              className={`money text-lg font-bold ${
                previewStock !== null && previewStock < 0 ? "text-danger" : "text-ink"
              }`}
            >
              {previewStock ?? selectedProduct.stock}
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input
          value={adjustmentQty}
          onChange={(event) => setAdjustmentQty(event.target.value)}
          placeholder="+/- quantity"
          inputMode="decimal"
          className="field"
        />
        <select
          value={adjustmentReason}
          onChange={(event) => setAdjustmentReason(event.target.value as StockMovementReason)}
          className="field"
        >
          <option value="correction">Correction</option>
          <option value="stock_in">Stock in</option>
          <option value="return">Return</option>
          <option value="damage">Damage</option>
          <option value="expired">Expired</option>
          <option value="owner_use">Owner use</option>
        </select>
      </div>
      <input
        value={adjustmentNote}
        onChange={(event) => setAdjustmentNote(event.target.value)}
        placeholder="Reason note"
        className="field"
      />
      <button
        type="button"
        onClick={onRecord}
        disabled={
          !adjustmentProductId ||
          !Number.isFinite(Number(adjustmentQty)) ||
          Number(adjustmentQty) === 0 ||
          isSubmitting
        }
        className="btn btn-primary w-full"
      >
        Save stock change
      </button>
    </div>
  </Sheet>
  );
};

export default StockAdjustSheet;
