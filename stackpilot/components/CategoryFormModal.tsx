
import React, { useState, useEffect } from 'react';
import { Category } from '../types';

interface CategoryFormModalProps {
    category: Category | null;
    onSave: (categoryData: Category | Omit<Category, 'id'>) => void;
    onClose: () => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (category) setName(category.name);
        else setName('');
    }, [category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim()) return;
        
        if (category) {
            onSave({ ...category, name });
        } else {
            onSave({ name });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">{category ? 'Edit Category' : 'Add New Category'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Category Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors">Save Category</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryFormModal;