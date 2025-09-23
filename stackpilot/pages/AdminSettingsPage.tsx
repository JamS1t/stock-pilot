
import React from 'react';

// Mock data for demonstration purposes
const mockUsers = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
    { id: 2, name: 'Manager User', email: 'manager@example.com', role: 'Manager' },
    { id: 3, name: 'Cashier User', email: 'cashier@example.com', role: 'Cashier' },
    { id: 4, name: 'Staff User', email: 'staff@example.com', role: 'Staff' },
];

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const roleColors: { [key: string]: string } = {
        'Admin': 'bg-red-500/20 text-red-400',
        'Manager': 'bg-yellow-500/20 text-yellow-400',
        'Cashier': 'bg-sky-500/20 text-sky-400',
        'Staff': 'bg-green-500/20 text-green-400',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-500/20 text-gray-400'}`}>
            {role}
        </span>
    );
};

const AdminSettingsPage: React.FC = () => {
    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Settings</h1>
                <p className="text-gray-400">Manage users, roles, and system settings.</p>
            </header>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Role</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div>{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-400">Active</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default AdminSettingsPage;