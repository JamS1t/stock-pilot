import React, { useState, useMemo } from 'react';
import { Product, Category, Supplier } from '../types';
import InventoryTable from '../components/InventoryTable';
import ProductFormModal from '../components/ProductFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { PlusCircleIcon } from '../components/icons';

interface InventoryPageProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ products, categories, suppliers, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockStatusFilter, setStockStatusFilter] = useState('all');

    // New states for confirmation modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalContent, setConfirmModalContent] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'primary' as 'primary' | 'danger'
    });

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = categoryFilter === 'all' || p.categoryId === categoryFilter;
            const stockStatusMatch = stockStatusFilter === 'all' || 
                (stockStatusFilter === 'in_stock' && p.stock > 10) ||
                (stockStatusFilter === 'low_stock' && p.stock > 0 && p.stock <= 10) ||
                (stockStatusFilter === 'out_of_stock' && p.stock === 0);

            return searchMatch && categoryMatch && stockStatusMatch;
        });
    }, [products, searchTerm, categoryFilter, stockStatusFilter]);


    const handleOpenModalForCreate = () => {
        setEditingProduct(null);
        setIsFormModalOpen(true);
    };

    const handleOpenModalForEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleSaveProduct = (productData: Product | Omit<Product, 'id'>) => {
        const action = () => {
            if ('id' in productData) {
                onUpdateProduct(productData as Product);
            } else {
                onAddProduct(productData);
            }
            handleCloseFormModal();
            setIsConfirmModalOpen(false);
        };
        
        setConfirmModalContent({
            title: 'Confirm Save',
            message: `Are you sure you want to save the changes for this product?`,
            onConfirm: action,
            variant: 'primary'
        });
        setIsConfirmModalOpen(true);
    };
    
    const handleDeleteConfirmation = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const action = () => {
            onDeleteProduct(productId);
            setIsConfirmModalOpen(false);
        };

        setConfirmModalContent({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete the product "${product.name}"? This action cannot be undone.`,
            onConfirm: action,
            variant: 'danger'
        });
        setIsConfirmModalOpen(true);
    };

    const handleCancelConfirmation = () => {
        setIsConfirmModalOpen(false);
    };


    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
                    <p className="text-gray-400">Add, edit, and remove products.</p>
                </div>
                <button 
                    onClick={handleOpenModalForCreate}
                    className="flex items-center space-x-2 bg-sky-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/20"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    <span>Add Product</span>
                </button>
            </header>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="md:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                     <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="md:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)} className="md:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none">
                        <option value="all">All Stock Statuses</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                </div>
                <InventoryTable 
                    products={filteredProducts} 
                    mode="management"
                    categories={categories}
                    onEdit={handleOpenModalForEdit}
                    onDelete={handleDeleteConfirmation}
                />
            </div>

            {isFormModalOpen && (
                <ProductFormModal 
                    product={editingProduct} 
                    categories={categories}
                    suppliers={suppliers}
                    onSave={handleSaveProduct} 
                    onClose={handleCloseFormModal}
                />
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title={confirmModalContent.title}
                message={confirmModalContent.message}
                variant={confirmModalContent.variant}
                onConfirm={confirmModalContent.onConfirm}
                onCancel={handleCancelConfirmation}
            />
        </main>
    );
};

export default InventoryPage;