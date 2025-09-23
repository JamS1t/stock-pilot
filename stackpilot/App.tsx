
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import PosPage from './pages/PosPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import LoginPage from './pages/LoginPage';
import { Product, Category, Supplier, Order, OrderItem } from './types';
import { PRODUCTS, CATEGORIES, SUPPLIERS, ORDERS } from './constants';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activePage, setActivePage] = useState('pos');
    
    // Data state
    const [products, setProducts] = useState<Product[]>(PRODUCTS);
    const [categories, setCategories] = useState<Category[]>(CATEGORIES);
    const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
    const [orders, setOrders] = useState<Order[]>(ORDERS);
    const [cart, setCart] = useState<OrderItem[]>([]);
    
    // --- Handlers ---
    
    const handleLogin = () => setIsAuthenticated(true);
    const handleLogout = () => setIsAuthenticated(false);

    // Cart Handlers
    const handleAddToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, {
                id: `cart-item-${Date.now()}`,
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                categoryId: product.categoryId,
            }];
        });
    };
    
    const handleUpdateQuantity = (productId: string, quantity: number) => {
        setCart(prevCart => prevCart.map(item =>
            item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    const handleRemoveFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    const handleClearCart = () => {
        setCart([]);
    };

    // Order Handler
    const handleCreateOrder = (payload: {
        items: OrderItem[];
        total: number;
        subtotal: number;
        tax: number;
        paymentMethod: 'cash' | 'card';
        discount: number;
        discountAmount: number;
        discountType: 'percentage' | 'fixed';
    }): Order => {
        const newOrder: Order = {
            id: `ord-${Date.now()}`,
            date: new Date(),
            ...payload
        };
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        // Update stock
        setProducts(prevProducts => {
            const newProducts = [...prevProducts];
            payload.items.forEach(item => {
                const productIndex = newProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    newProducts[productIndex].stock -= item.quantity;
                }
            });
            return newProducts;
        });

        handleClearCart();
        return newOrder;
    };
    
    // Product Handlers
    const handleAddProduct = (productData: Omit<Product, 'id'>) => {
        const newProduct: Product = {
            id: `prod-${Date.now()}`,
            ...productData
        };
        setProducts(prev => [newProduct, ...prev]);
    };

    const handleUpdateProduct = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };
    
    const handleDeleteProduct = (productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    };
    
    // Category Handlers
    const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
        const newCategory: Category = {
            id: `cat-${Date.now()}`,
            ...categoryData
        };
        setCategories(prev => [newCategory, ...prev]);
    };

    const handleUpdateCategory = (updatedCategory: Category) => {
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    };

    const handleDeleteCategory = (categoryId: string) => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    // Supplier Handlers
    const handleAddSupplier = (supplierData: Omit<Supplier, 'id'>) => {
        const newSupplier: Supplier = {
            id: `sup-${Date.now()}`,
            ...supplierData
        };
        setSuppliers(prev => [newSupplier, ...prev]);
    };

    const handleUpdateSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    };

    const handleDeleteSupplier = (supplierId: string) => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    };


    const renderActivePage = () => {
        switch (activePage) {
            case 'pos':
                return <PosPage 
                    products={products} 
                    categories={categories}
                    cart={cart}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFromCart={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    onCreateOrder={handleCreateOrder}
                />;
            case 'inventory':
                return <InventoryPage
                    products={products}
                    categories={categories}
                    suppliers={suppliers}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                />;
            case 'reports':
                return <ReportsPage orders={orders} products={products} categories={categories} />;
            case 'categories':
                return <CategoriesPage 
                    categories={categories}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                />;
            case 'suppliers':
                return <SuppliersPage 
                    suppliers={suppliers}
                    onAddSupplier={handleAddSupplier}
                    onUpdateSupplier={handleUpdateSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                />;
            case 'order_history':
                return <OrderHistoryPage orders={orders} />;
            case 'settings':
                return <AdminSettingsPage />;
            default:
                return <PosPage 
                    products={products} 
                    categories={categories}
                    cart={cart}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFromCart={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    onCreateOrder={handleCreateOrder}
                />;
        }
    };
    
    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
            {renderActivePage()}
        </div>
    );
};

export default App;
