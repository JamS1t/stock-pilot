import React, { useState, useEffect } from 'react';
import { Supplier, createSupplier, updateSupplier } from '../utils/api'; // Import Supplier interface and API functions
import ConfirmationModal from './ConfirmationModal'; // Import ConfirmationModal
import DialogFrame from './DialogFrame';

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
        <>
            <DialogFrame onClose={onClose} maxWidth="max-w-lg">
                <h2 className="font-display text-xl font-bold text-ink mb-6">
                    {supplier ? 'Edit supplier' : 'Add supplier'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="field-label">
                                Supplier name
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="field"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact_person" className="field-label">
                                Contact person (optional)
                            </label>
                            <input
                                type="text"
                                name="contact_person"
                                id="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                disabled={loading}
                                className="field"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="field-label">
                                Phone number (optional)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                                className="field"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="email" className="field-label">
                                Email (optional)
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                className="field"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="field-label">
                                Address (optional)
                            </label>
                            <input
                                type="text"
                                name="address"
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                disabled={loading}
                                className="field"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-danger text-center">{error}</p>}

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
                                    <span className="ml-2">Saving…</span>
                                </div>
                            ) : (
                                'Save supplier'
                            )}
                        </button>
                    </div>
                </form>
            </DialogFrame>

            <ConfirmationModal
                isOpen={isConfirmSaveOpen}
                title={`Confirm ${supplier ? 'Update' : 'Creation'}`}
                message={`Are you sure you want to ${supplier ? 'update' : 'create'} the supplier "${formData.name}"?`}
                variant="primary"
                onConfirm={handleConfirmSave}
                onCancel={() => setIsConfirmSaveOpen(false)}
            />
        </>
    );
};

export default SupplierFormModal;
