import React, { useState, useEffect } from 'react';
import { Supplier, createSupplier, updateSupplier } from '../utils/api'; // Import Supplier interface and API functions
import ConfirmationModal from './ConfirmationModal'; // Import ConfirmationModal

interface SupplierFormModalProps {
    supplier: Supplier | null;
    onSave: () => void; // onSave now just triggers a re-fetch in parent
    onClose: () => void;
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ supplier, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
    });
    const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Populate form when editing supplier or reset when adding new one
    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || '',
                contact_person: supplier.contact_person || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || ''
            });
        } else {
            setFormData({
                name: '',
                contact_person: '',
                phone: '',
                email: '',
                address: ''
            });
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Supplier name cannot be empty.');
            return;
        }
        setIsConfirmSaveOpen(true);
    };

    const handleConfirmSave = async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (supplier) {
                await updateSupplier(supplier.supplier_id, formData);
            } else {
                await createSupplier(formData);
            }
            onSave(); // Notify parent to re-fetch suppliers
            onClose(); // Close modal on success
        } catch (err: any) {
            setError(err.message || 'Failed to save supplier.');
        } finally {
            setLoading(false);
            setIsConfirmSaveOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-white mb-6">
                    {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                                Supplier Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-400 mb-1">
                                Contact Person (Optional)
                            </label>
                            <input
                                type="text"
                                name="contact_person"
                                id="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
                                Address (Optional)
                            </label>
                            <input
                                type="text"
                                name="address"
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span className="ml-2">Saving...</span>
                                </div>
                            ) : (
                                'Save Supplier'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={isConfirmSaveOpen}
                title={`Confirm ${supplier ? 'Update' : 'Creation'}`}
                message={`Are you sure you want to ${supplier ? 'update' : 'create'} the supplier "${formData.name}"?`}
                variant="primary"
                onConfirm={handleConfirmSave}
                onCancel={() => setIsConfirmSaveOpen(false)}
            />
        </div>
    );
};

export default SupplierFormModal;
