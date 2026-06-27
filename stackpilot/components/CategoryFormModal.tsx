
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="card w-full max-w-md p-6 shadow-pop animate-fade-in" onClick={e => e.stopPropagation()}>
                <h2 className="font-display text-xl font-bold text-ink mb-5">{category ? 'Edit category' : 'Add new category'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="field-label">Category name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                            className="field"
                        />
                    </div>
                    {error && <div className="rounded-xl border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger">{error}</div>}
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={loading} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span className="ml-2">Saving…</span>
                                </div>
                            ) : (
                                'Save category'
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
