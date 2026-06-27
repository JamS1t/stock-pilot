
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
        'Admin': 'bg-danger-tint text-danger',
        'Manager': 'bg-utang-tint text-utang',
        'Cashier': 'bg-gcash-tint text-gcash',
        'Staff': 'bg-peso-tint text-peso-deep',
    };
    return (
        <span className={`pill ${roleColors[role] || 'pill-muted'}`}>
            {role}
        </span>
    );
};

const AdminSettingsPage: React.FC = () => {
    return (
        <main className="page">
            <div className="page-inner space-y-4 lg:space-y-5">
                <header className="pl-12 lg:pl-0">
                    <p className="eyebrow">Pamamahala</p>
                    <h1 className="page-title mt-1">Admin settings</h1>
                    <p className="mt-1 text-sm text-muted">Manage users, roles, and system settings.</p>
                </header>

                <section className="card p-4 lg:p-5">
                    <h2 className="mb-4 font-display text-lg font-semibold text-ink">User management</h2>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">User</th>
                                    <th scope="col">Role</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="font-medium text-ink">{user.name}</div>
                                            <div className="text-xs text-faint">{user.email}</div>
                                        </td>
                                        <td>
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td>
                                            <span className="pill pill-ok">
                                                <span className="pill-dot" />
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default AdminSettingsPage;
