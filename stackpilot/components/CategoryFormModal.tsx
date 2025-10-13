
import React, { useState, useEffect } from 'react';
import { Category, createCategory, updateCategory } from '../utils/api';
import ConfirmationModal from './ConfirmationModal'; // Add ConfirmationModal import

interface CategoryFormModalProps {
    category: Category | null;
    onSave: () => void; // onSave now just triggers a re-fetch in parent
    onClose: () => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (category) setName(category.name);
        else setName('');
        setError(null); // Clear error on modal open/category change
    }, [category]);

    const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Category name cannot be empty.');
            return;
        }
        setIsConfirmSaveOpen(true);
    };

    const handleConfirmSave = async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (category) {
                await updateCategory(category.category_id, name);
                // console.log('Category updated successfully.');
            } else {
                await createCategory(name);
                // console.log('Category created successfully.');
            }
            onSave(); // Notify parent to re-fetch categories
            onClose(); // Close modal on success
        } catch (err: any) {
            console.error('Failed to save category:', err);
            setError(err.message || 'Failed to save category.');
        } finally {
            setLoading(false);
            setIsConfirmSaveOpen(false);
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
                            disabled={loading}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors">
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span className="ml-2">Saving...</span>
                                </div>
                            ) : (
                                'Save Category'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <ConfirmationModal
                isOpen={isConfirmSaveOpen}
                title={`Confirm ${category ? 'Update' : 'Creation'}`}
                message={`Are you sure you want to ${category ? 'update' : 'create'} the category "${name}"?`}
                variant="primary"
                onConfirm={handleConfirmSave}
                onCancel={() => setIsConfirmSaveOpen(false)}
            />
        </div>
    );
};

export default CategoryFormModal;
