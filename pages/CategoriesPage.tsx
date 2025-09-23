import React, { useState } from 'react';
import { Category } from '../types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
import CategoryFormModal from '../components/CategoryFormModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface CategoriesPageProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalContent, setConfirmModalContent] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'primary' as 'primary' | 'danger'
    });

    const handleOpenModalForCreate = () => {
        setEditingCategory(null);
        setIsFormModalOpen(true);
    };

    const handleOpenModalForEdit = (category: Category) => {
        setEditingCategory(category);
        setIsFormModalOpen(true);
    };
    
    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleSaveCategory = (categoryData: Category | Omit<Category, 'id'>) => {
        const action = () => {
            if ('id' in categoryData) {
                onUpdateCategory(categoryData as Category);
            } else {
                onAddCategory(categoryData);
            }
            handleCloseFormModal();
            setIsConfirmModalOpen(false);
        };
        
        setConfirmModalContent({
            title: 'Confirm Save',
            message: `Are you sure you want to save changes for the category "${categoryData.name}"?`,
            onConfirm: action,
            variant: 'primary'
        });
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirmation = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const action = () => {
            onDeleteCategory(categoryId);
            setIsConfirmModalOpen(false);
        };

        setConfirmModalContent({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
            onConfirm: action,
            variant: 'danger'
        });
        setIsConfirmModalOpen(true);
    };

    const handleCancelConfirmation = () => {
        setIsConfirmModalOpen(false);
    };

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Category Management</h1>
                    <p className="text-gray-400">Add, edit, and manage product categories.</p>
                </div>
                <button 
                    onClick={handleOpenModalForCreate}
                    className="flex items-center space-x-2 bg-sky-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/20"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    <span>Add Category</span>
                </button>
            </header>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Category Name</th>
                                <th scope="col" className="px-6 py-3">Category ID</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-white">{category.name}</td>
                                    <td className="px-6 py-4">{category.id}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => handleOpenModalForEdit(category)} className="p-2 text-yellow-400 rounded-full hover:bg-yellow-400/10"><EditIcon /></button>
                                            <button onClick={() => handleDeleteConfirmation(category.id)} className="p-2 text-red-400 rounded-full hover:bg-red-400/10"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormModalOpen && (
                <CategoryFormModal
                    category={editingCategory}
                    onSave={handleSaveCategory}
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

export default CategoriesPage;