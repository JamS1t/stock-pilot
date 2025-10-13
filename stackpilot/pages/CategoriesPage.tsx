  import React, { useState, useEffect, useCallback } from 'react';
  import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
  import CategoryFormModal from '../components/CategoryFormModal';
  import ConfirmationModal from '../components/ConfirmationModal';
  import { getCategories, deleteCategory, Category } from '../utils/api'; // Import API functions and Category interface
  import { useAuth } from '../context/AuthContext'; // Import useAuth hook

  interface CategoriesPageProps {
    // No props needed as data is fetched internally
  }

  const CategoriesPage: React.FC<CategoriesPageProps> = () => {
      const { isAuthenticated } = useAuth(); // Use auth context to check if authenticated
      const [categories, setCategories] = useState<Category[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      const [isFormModalOpen, setIsFormModalOpen] = useState(false);
      const [editingCategory, setEditingCategory] = useState<Category | null>(null);
      
      const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
      const [confirmModalContent, setConfirmModalContent] = useState({
          title: '',
          message: '',
          onConfirm: () => {},
          variant: 'primary' as 'primary' | 'danger'
      });

      const fetchCategories = useCallback(async () => {
          if (!isAuthenticated) return;
          setLoading(true);
          setError(null);
          try {
              const response = await getCategories();
              if (Array.isArray(response.data)) {
                  setCategories(response.data);
              } else {
                  // If a single category is returned, wrap it in an array
                  setCategories([response.data]);
              }
          } catch (err: any) {
              // console.error('Failed to fetch categories:', err);
              setError(err.message || 'Failed to fetch categories.');
          } finally {
              setLoading(false);
          }
      }, [isAuthenticated]);

      useEffect(() => {
          fetchCategories();
      }, [fetchCategories]);

      const handleOpenModalForCreate = () => {
          setEditingCategory(null);
          setIsFormModalOpen(true);
      };

      const handleOpenModalForEdit = (category: Category) => {
          setEditingCategory(category);
          setIsFormModalOpen(true);
      };
      
      const handleCloseFormModal = () => {
          setIsFormModalOpen(false);
          setEditingCategory(null); // Clear editing category on close
      };

      const handleSaveCategory = () => {
          // This function will be handled by CategoryFormModal directly calling API
          // After save, re-fetch categories
          fetchCategories();
          handleCloseFormModal();
          setIsConfirmModalOpen(false); // Close confirmation if it was open
      };

      const handleDeleteConfirmation = (categoryId: number) => {
          const category = categories.find(c => c.category_id === categoryId);
          if (!category) return;

          const action = async () => {
              setLoading(true);
              setError(null);
              try {
                  await deleteCategory(categoryId);
                  // console.log(`Category ${categoryId} deleted successfully.`);
                  fetchCategories(); // Re-fetch categories after deletion
              } catch (err: any) {
                  // console.error('Failed to delete category:', err);
                  setError(err.message || 'Failed to delete category.');
              } finally {
                  setLoading(false);
                  setIsConfirmModalOpen(false);
              }
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

      if (loading) {
          return (
              <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                  <p className="ml-3 text-sky-400">Loading categories...</p>
              </main>
          );
      }

      if (error) {
          return (
              <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center text-red-400">
                  <p>Error: {error}</p>
                  <button onClick={fetchCategories} className="ml-4 px-4 py-2 bg-sky-600 text-white rounded-md">Retry</button>
              </main>
          );
      }

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
                                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {categories.length === 0 ? (
                                  <tr>
                                      <td colSpan={2} className="px-6 py-4 text-center text-gray-500">No categories found.</td>
                                  </tr>
                              ) : (
                                  categories.map((category) => (
                                      <tr key={category.category_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                          <td className="px-6 py-4 font-medium text-white">{category.name}</td>
                                          <td className="px-6 py-4 text-center">
                                              <div className="flex items-center justify-center space-x-2">
                                                  <button onClick={() => handleOpenModalForEdit(category)} className="p-2 text-yellow-400 rounded-full hover:bg-yellow-400/10"><EditIcon /></button>
                                                  <button onClick={() => handleDeleteConfirmation(category.category_id)} className="p-2 text-red-400 rounded-full hover:bg-red-400/10"><TrashIcon /></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {isFormModalOpen && (
                  <CategoryFormModal
                      category={editingCategory}
                      onSave={handleSaveCategory} // This will trigger re-fetch
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
