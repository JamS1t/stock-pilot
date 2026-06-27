import React from "react";
import { Product, Category, getProductById } from "../utils/api"; // Import Product and Category from API utils
import { PlusCircleIcon, EditIcon, TrashIcon } from "./icons";
import { useFormatters } from "@/format";

interface InventoryTableProps {
  products: Product[];
  categories: Category[];
  mode: "pos" | "management";
  onAddToCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: number) => void;
  cartItems?: { product_id: number; quantity: number }[]; // New prop for cart state
}

const StockStatusBadge: React.FC<{ stock: number }> = ({ stock }) => {
  let pillClass = "pill-ok";
  let text = "In stock";

  if (stock <= 10 && stock > 0) {
    pillClass = "pill-warn";
    text = "Paubos na";
  } else if (stock === 0) {
    pillClass = "pill-bad";
    text = "Out of stock";
  }

  return <span className={`pill ${pillClass}`}>{text}</span>;
};

const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  categories,
  mode,
  onAddToCart,
  onEdit,
  onDelete,
  cartItems = [],
}) => {
  const getCategoryName = (categoryId: number) => {
    return (
      categories.find((c) => c.category_id === categoryId)?.name || "Unknown"
    );
  };

  const { formatCurrency } = useFormatters();

  return (
    <div className="relative flex-1 overflow-auto">
      <table className="data-table">
        <thead className="sticky top-0 z-10">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[250px] bg-sunken"
            >
              Produkto
            </th>
            <th scope="col" className="min-w-[150px]">
              Category
            </th>
            <th scope="col" className="min-w-[150px]">
              SKU
            </th>
            <th scope="col" className="min-w-[150px]">
              Barcode
            </th>
            <th scope="col" className="min-w-[100px] text-right">
              Price
            </th>
            <th scope="col" className="min-w-[100px] text-center">
              Stock
            </th>
            <th scope="col" className="min-w-[120px] text-center">
              Status
            </th>
            <th scope="col" className="min-w-[120px] text-center">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.product_id} className="group">
              <td className="sticky left-0 whitespace-nowrap bg-surface font-semibold text-ink group-hover:bg-sunken">
                {product.name}
              </td>
              <td className="whitespace-nowrap text-muted">
                {getCategoryName(product.category_id)}
              </td>
              <td className="whitespace-nowrap font-mono text-xs text-muted">
                {product.sku || "—"}
              </td>
              <td className="whitespace-nowrap font-mono text-xs text-muted">
                {product.barcode || "—"}
              </td>
              <td className="whitespace-nowrap text-right">
                {isNaN(product.selling_price) ? (
                  <span className="text-danger">Invalid price</span>
                ) : (
                  <span className="money font-semibold text-peso">
                    {formatCurrency(product.selling_price)}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap text-center">
                <span className="money font-semibold">{product.stock}</span>
              </td>
              <td className="whitespace-nowrap text-center">
                <StockStatusBadge stock={product.stock} />
              </td>
              <td className="whitespace-nowrap text-center">
                {mode === "pos" && onAddToCart && (
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={
                      product.stock === 0 ||
                      (cartItems.find((item) => item.product_id === product.product_id)?.quantity || 0) >= product.stock
                    }
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-peso transition-colors hover:bg-peso-tint disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-transparent"
                    aria-label="Add to cart"
                  >
                    <PlusCircleIcon />
                  </button>
                )}
                {mode === "management" && (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={async () => {
                        try {
                          const response = await getProductById(product.product_id);
                          if (response.data) {
                            onEdit?.(response.data);
                          }
                        } catch (error) {
                          // Handle error
                        }
                      }}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-sunken hover:text-ink"
                      aria-label="Edit product"
                    >
                      <EditIcon />
                    </button>

                    <button
                      onClick={() => onDelete?.(product.product_id)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger-tint"
                      aria-label="Delete product"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;