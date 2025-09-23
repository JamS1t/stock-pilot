
import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';

interface SupplierFormModalProps {
    supplier: Supplier | null;
    onSave: (supplierData: Supplier | Omit<Supplier, 'id'>) => void;
    onClose: () => void;
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ supplier, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address
            });
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (supplier) {
            onSave({ ...supplier, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Supplier Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-400 mb-1">Contact Person</label>
                            <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors">Save Supplier</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierFormModal;