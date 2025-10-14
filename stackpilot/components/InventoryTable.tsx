import React from "react";
import { Product, Category, getProductById } from "../utils/api"; // Import Product and Category from API utils
import { PlusCircleIcon, EditIcon, TrashIcon } from "./icons";
import { formatCurrency } from "../format";

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
  let bgColor = "bg-green-500/20 text-green-400";
  let text = "In Stock";

  if (stock <= 10 && stock > 0) {
    bgColor = "bg-yellow-500/20 text-yellow-400";
    text = "Low Stock";
  } else if (stock === 0) {
    bgColor = "bg-red-500/20 text-red-400";
    text = "Out of Stock";
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor}`}>
      {text}
    </span>
  );
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

  return (
    <div className="flex-1 overflow-auto relative">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-300 uppercase bg-gray-800 sticky top-0 z-10">
          <tr>
            <th
              scope="col"
              className="sticky left-0 px-4 py-3 bg-gray-800 min-w-[250px]"
            >
              Product
            </th>
            <th scope="col" className="px-4 py-3 min-w-[150px]">
              Category
            </th>
            <th scope="col" className="px-4 py-3 min-w-[150px]">
              SKU
            </th>
            <th scope="col" className="px-4 py-3 min-w-[150px]">
              Barcode
            </th>
            <th scope="col" className="px-4 py-3 text-right min-w-[100px]">
              Price
            </th>
            <th scope="col" className="px-4 py-3 text-center min-w-[100px]">
              Stock
            </th>
            <th scope="col" className="px-4 py-3 text-center min-w-[120px]">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-center min-w-[120px]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.product_id}
              className="border-b border-gray-700 hover:bg-gray-700/50 group"
            >
              <td className="sticky left-0 px-4 py-3 font-medium text-white whitespace-nowrap bg-gray-800 group-hover:bg-gray-700/50">
                {product.name}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {getCategoryName(product.category_id)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                {product.sku || "-----"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                {product.barcode || "-----"}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {isNaN(product.selling_price)
                  ? "Invalid Price"
                  : formatCurrency(product.selling_price)}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                {product.stock}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <StockStatusBadge stock={product.stock} />
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                {mode === "pos" && onAddToCart && (
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={
                      product.stock === 0 ||
                      (cartItems.find((item) => item.product_id === product.product_id)?.quantity || 0) >= product.stock
                    }
                    className="p-2 text-sky-400 rounded-full hover:bg-sky-400/10 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors duration-200"
                    aria-label="Add to cart"
                  >
                    <PlusCircleIcon />
                  </button>
                )}
                {mode === "management" && (
                  <div className="flex items-center justify-center space-x-2">
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
                      className="p-2 text-yellow-400 rounded-full hover:bg-yellow-400/10 transition-colors duration-200"
                      aria-label="Edit product"
                    >
                      <EditIcon />
                    </button>

                    <button
                      onClick={() => onDelete?.(product.product_id)}
                      className="p-2 text-red-400 rounded-full hover:bg-red-400/10 transition-colors duration-200"
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