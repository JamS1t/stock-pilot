import React, { useState } from 'react';
import { Supplier } from '../types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
import SupplierFormModal from '../components/SupplierFormModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface SuppliersPageProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalContent, setConfirmModalContent] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'primary' as 'primary' | 'danger'
    });

    const handleOpenModalForCreate = () => {
        setEditingSupplier(null);
        setIsFormModalOpen(true);
    };

    const handleOpenModalForEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsFormModalOpen(true);
    };
    
    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleSaveSupplier = (supplierData: Supplier | Omit<Supplier, 'id'>) => {
        const action = () => {
            if ('id' in supplierData) {
                onUpdateSupplier(supplierData as Supplier);
            } else {
                onAddSupplier(supplierData);
            }
            handleCloseFormModal();
            setIsConfirmModalOpen(false);
        };
        
        setConfirmModalContent({
            title: 'Confirm Save',
            message: `Are you sure you want to save changes for the supplier "${supplierData.name}"?`,
            onConfirm: action,
            variant: 'primary'
        });
        setIsConfirmModalOpen(true);
    };
    
    const handleDeleteConfirmation = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const action = () => {
            onDeleteSupplier(supplierId);
            setIsConfirmModalOpen(false);
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
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-white">{supplier.name}</td>
                                    <td className="px-6 py-4">{supplier.contactPerson}</td>
                                    <td className="px-6 py-4">{supplier.phone}</td>
                                    <td className="px-6 py-4">{supplier.email}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => handleOpenModalForEdit(supplier)} className="p-2 text-yellow-400 rounded-full hover:bg-yellow-400/10"><EditIcon /></button>
                                            <button onClick={() => handleDeleteConfirmation(supplier.id)} className="p-2 text-red-400 rounded-full hover:bg-red-400/10"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormModalOpen && (
                <SupplierFormModal
                    supplier={editingSupplier}
                    onSave={handleSaveSupplier}
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