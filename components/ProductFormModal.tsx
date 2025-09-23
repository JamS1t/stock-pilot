import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier } from '../types';

interface ProductFormModalProps {
    product: Product | null;
    categories: Category[];
    suppliers: Supplier[];
    onSave: (productData: Product | Omit<Product, 'id'>) => void;
    onClose: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, categories, suppliers, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        stock: '',
        categoryId: '',
        supplierId: '',
        barcode: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                price: product.price.toString(),
                stock: product.stock.toString(),
                categoryId: product.categoryId,
                supplierId: product.supplierId || '',
                barcode: product.barcode || '',
            });
        } else {
            setFormData({
                name: '',
                sku: '',
                price: '',
                stock: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                supplierId: suppliers.length > 0 ? suppliers[0].id : '',
                barcode: '',
            });
        }
    }, [product, categories, suppliers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productData = {
            ...formData,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
        };
        if (product) {
            onSave({ ...product, ...productData });
        } else {
            onSave(productData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Product Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-400 mb-1">SKU</label>
                            <input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-400 mb-1">Price</label>
                            <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-400 mb-1">Stock Quantity</label>
                            <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required min="0" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                         <div>
                            <label htmlFor="barcode" className="block text-sm font-medium text-gray-400 mb-1">Barcode</label>
                            <input type="text" name="barcode" id="barcode" value={formData.barcode} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                         <div>
                             <label htmlFor="categoryId" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                            <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label htmlFor="supplierId" className="block text-sm font-medium text-gray-400 mb-1">Supplier</label>
                            <select name="supplierId" id="supplierId" value={formData.supplierId} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none">
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;