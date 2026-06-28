import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
import SupplierFormModal from '../components/SupplierFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { getSuppliers, deleteSupplier, Supplier } from '../utils/api'; // Import API functions and Supplier interface
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

interface SuppliersPageProps {
  // No props needed as data is fetched internally
}

const SuppliersPage: React.FC<SuppliersPageProps> = () => {
    const { isAuthenticated } = useAuth(); // Use auth context to check if authenticated
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalContent, setConfirmModalContent] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'primary' as 'primary' | 'danger'
    });

    const fetchSuppliers = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        setError(null);
        try {
            const response = await getSuppliers();
            if (Array.isArray(response.data)) {
                setSuppliers(response.data);
            } else {
                // If a single supplier is returned, wrap it in an array
                setSuppliers([response.data]);
            }
        } catch (err: any) {
            // console.error('Failed to fetch suppliers:', err);
            setError(err.message || 'Failed to fetch suppliers.');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleOpenModalForCreate = () => {
        setEditingSupplier(null);
        setIsFormModalOpen(true);
    };

    const handleOpenModalForEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsFormModalOpen(true);
    };
    
    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEditingSupplier(null); // Clear editing supplier on close
    };

    const handleSaveSupplier = () => {
        // This function will be handled by SupplierFormModal directly calling API
        // After save, re-fetch suppliers
        fetchSuppliers();
        handleCloseFormModal();
        setIsConfirmModalOpen(false); // Close confirmation if it was open
    };
    
    const handleDeleteConfirmation = (supplierId: number) => {
        const supplier = suppliers.find(s => s.supplier_id === supplierId);
        if (!supplier) return;

        const action = async () => {
            setLoading(true);
            setError(null);
            try {
                await deleteSupplier(supplierId);
                // console.log(`Supplier ${supplierId} deleted successfully.`);
                fetchSuppliers(); // Re-fetch suppliers after deletion
            } catch (err: any) {
                // console.error('Failed to delete supplier:', err);
                setError(err.message || 'Failed to delete supplier.');
            } finally {
                setLoading(false);
                setIsConfirmModalOpen(false);
            }
        };

        setConfirmModalContent({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete the supplier "${supplier.name}"? This action cannot be undone.`,
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
            <main className="page">
                <div className="page-inner flex min-h-[60vh] items-center justify-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-peso"></div>
                    <p className="text-sm text-muted">Loading suppliers…</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page">
                <div className="page-inner flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <div>
                        <p className="font-display text-lg font-semibold text-ink">Hindi ma-load ang suppliers</p>
                        <p className="mt-1 text-sm text-danger">{error}</p>
                    </div>
                    <button onClick={fetchSuppliers} className="btn btn-primary">Subukan ulit</button>
                </div>
            </main>
        );
    }

    return (
        <main className="page">
            <div className="page-inner space-y-4 lg:space-y-5">
                <header className="flex flex-wrap items-end justify-between gap-3 pl-12 lg:pl-0">
                    <div>
                        <p className="eyebrow">Stock sources</p>
                        <h1 className="page-title mt-1">Suppliers</h1>
                        <p className="mt-1 text-sm text-muted">Add, edit, and manage who you restock from.</p>
                    </div>
                    <button
                        onClick={handleOpenModalForCreate}
                        className="btn btn-primary"
                    >
                        <PlusCircleIcon className="h-5 w-5" />
                        <span>Add supplier</span>
                    </button>
                </header>

                <div className="card overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Supplier name</th>
                                    <th scope="col">Contact person</th>
                                    <th scope="col">Phone</th>
                                    <th scope="col">Email</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <p className="text-sm font-semibold text-muted">Wala pang suppliers</p>
                                            <p className="mt-1 text-xs text-faint">Add your first supplier to track where stock comes from.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <tr key={supplier.supplier_id}>
                                            <td className="font-semibold text-ink">{supplier.name}</td>
                                            <td className="text-muted">{supplier.contact_person || '—'}</td>
                                            <td className="text-muted">{supplier.phone || '—'}</td>
                                            <td className="text-muted">{supplier.email || '—'}</td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleOpenModalForEdit(supplier)} className="btn btn-ghost min-h-11 min-w-11 px-0" aria-label={`Edit ${supplier.name}`}><EditIcon /></button>
                                                    <button onClick={() => handleDeleteConfirmation(supplier.supplier_id)} className="btn btn-danger min-h-11 min-w-11 px-0" aria-label={`Delete ${supplier.name}`}><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isFormModalOpen && (
                <SupplierFormModal
                    supplier={editingSupplier}
                    onSave={handleSaveSupplier} // This will trigger re-fetch
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

export default SuppliersPage;
