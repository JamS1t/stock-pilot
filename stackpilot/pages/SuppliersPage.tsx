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
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                <p className="ml-3 text-sky-400">Loading suppliers...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center text-red-400">
                <p>Error: {error}</p>
                <button onClick={fetchSuppliers} className="ml-4 px-4 py-2 bg-sky-600 text-white rounded-md">Retry</button>
            </main>
        );
    }

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Supplier Management</h1>
                    <p className="text-gray-400">Add, edit, and manage suppliers.</p>
                </div>
                <button 
                    onClick={handleOpenModalForCreate}
                    className="flex items-center space-x-2 bg-sky-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/20"
                >
                    <PlusCircleIcon className="w-5 h-5"/>
                    <span>Add Supplier</span>
                </button>
            </header>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Supplier Name</th>
                                <th scope="col" className="px-6 py-3">Contact Person</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No suppliers found.</td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr key={supplier.supplier_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-white">{supplier.name}</td>
                                        <td className="px-6 py-4">{supplier.contact_person || '-----'}</td>
                                        <td className="px-6 py-4">{supplier.phone || '-----'}</td>
                                        <td className="px-6 py-4">{supplier.email || '-----'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => handleOpenModalForEdit(supplier)} className="p-2 text-yellow-400 rounded-full hover:bg-yellow-400/10"><EditIcon /></button>
                                                <button onClick={() => handleDeleteConfirmation(supplier.supplier_id)} className="p-2 text-red-400 rounded-full hover:bg-red-400/10"><TrashIcon /></button>
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
