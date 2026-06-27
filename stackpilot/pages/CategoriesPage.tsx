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
              <main className="page flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-peso"></div>
                  <p className="ml-3 text-muted">Loading categories…</p>
              </main>
          );
      }

      if (error) {
          return (
              <main className="page flex items-center justify-center">
                  <div className="card flex items-center gap-4 p-6">
                      <p className="text-sm text-danger">{error}</p>
                      <button onClick={fetchCategories} className="btn btn-primary">Retry</button>
                  </div>
              </main>
          );
      }

      return (
          <main className="page">
              <div className="page-inner space-y-4 lg:space-y-5">
                  <header className="flex flex-wrap items-end justify-between gap-3 pl-12 lg:pl-0">
                      <div>
                          <p className="eyebrow">Stock</p>
                          <h1 className="page-title mt-1">Categories</h1>
                          <p className="mt-1 text-sm text-muted">Ayusin ang mga grupo ng produkto.</p>
                      </div>
                      <button
                          onClick={handleOpenModalForCreate}
                          className="btn btn-primary"
                      >
                          <PlusCircleIcon className="w-5 h-5"/>
                          <span>Add category</span>
                      </button>
                  </header>

                  <div className="card overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="data-table">
                              <thead>
                                  <tr>
                                      <th scope="col">Category name</th>
                                      <th scope="col" className="text-center">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {categories.length === 0 ? (
                                      <tr>
                                          <td colSpan={2} className="py-10 text-center">
                                              <p className="text-sm font-semibold text-muted">No categories yet</p>
                                              <p className="mt-1 text-xs text-faint">Add your first category to group your products.</p>
                                          </td>
                                      </tr>
                                  ) : (
                                      categories.map((category) => (
                                          <tr key={category.category_id}>
                                              <td className="font-semibold text-ink">{category.name}</td>
                                              <td className="text-center">
                                                  <div className="flex items-center justify-center gap-1">
                                                      <button onClick={() => handleOpenModalForEdit(category)} aria-label="Edit category" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-sunken hover:text-ink"><EditIcon /></button>
                                                      <button onClick={() => handleDeleteConfirmation(category.category_id)} aria-label="Delete category" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger-tint"><TrashIcon /></button>
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
              </div>
          </main>
      );
  };

  export default CategoriesPage;
