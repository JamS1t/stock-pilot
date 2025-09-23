import React, { useState, useMemo } from 'react';
import { Product, Category, OrderItem, Order } from '../types';
import InventoryTable from '../components/InventoryTable';
import PosSystem from '../components/PosSystem';
import InvoiceModal from '../components/InvoiceModal';

interface PosPageProps {
  products: Product[];
  categories: Category[];
  cart: OrderItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCreateOrder: (payload: {
    items: OrderItem[];
    total: number;
    subtotal: number;
    tax: number;
    paymentMethod: 'cash' | 'card';
    discount: number;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
  }) => Order;
}

const PosPage: React.FC<PosPageProps> = ({ 
    products, 
    categories, 
    cart, 
    onAddToCart, 
    onUpdateQuantity,
    onRemoveFromCart,
    onClearCart,
    onCreateOrder
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [orderForReceipt, setOrderForReceipt] = useState<Order | null>(null);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = categoryFilter === 'all' || p.categoryId === categoryFilter;
            return searchMatch && categoryMatch;
        });
    }, [products, searchTerm, categoryFilter]);

    const handleOrderCreation = (payload: {
        items: OrderItem[];
        total: number;
        subtotal: number;
        tax: number;
        paymentMethod: 'cash' | 'card';
        discount: number;
        discountAmount: number;
        discountType: 'percentage' | 'fixed';
    }) => {
        const newOrder = onCreateOrder(payload);
        setOrderForReceipt(newOrder);
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col min-w-0">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Point of Sale</h1>
                    <p className="text-gray-400">Create a new order by adding products from the list.</p>
                </header>
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)} 
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <InventoryTable 
                        products={filteredProducts} 
                        categories={categories}
                        mode="pos"
                        onAddToCart={onAddToCart}
                    />
                </div>
            </main>
            <PosSystem 
                cart={cart}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveFromCart={onRemoveFromCart}
                onClearCart={onClearCart}
                onCreateOrder={handleOrderCreation}
            />
            {orderForReceipt && (
                <InvoiceModal 
                    order={orderForReceipt}
                    onClose={() => setOrderForReceipt(null)}
                />
            )}
        </div>
    );
};

export default PosPage;