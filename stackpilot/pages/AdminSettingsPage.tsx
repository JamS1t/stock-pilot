import React from "react";
import { useAuth } from "../context/AuthContext";

const FieldRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
    <span className="text-sm text-muted">{label}</span>
    <span className="text-right text-sm font-semibold text-ink">{value}</span>
  </div>
);

const AdminSettingsPage: React.FC = () => {
  const { user, store, role } = useAuth();
  const storeName = store?.name || store?.store_name || "Current store";

  return (
    <main className="page">
      <div className="page-inner space-y-4 lg:space-y-5">
        <header className="pl-12 lg:pl-0">
          <p className="eyebrow">Pamamahala</p>
          <h1 className="page-title mt-1">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Review the live store and account configuration for this session.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4 lg:p-5">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              Store settings
            </h2>
            <FieldRow label="Store name" value={storeName} />
            <FieldRow label="Timezone" value={store?.timezone || "Not set"} />
            <FieldRow label="Currency" value={store?.currency || "Not set"} />
            <FieldRow
              label="Receipt details"
              value={<span className="text-muted">Not configured</span>}
            />
            <FieldRow
              label="Tax settings"
              value={<span className="text-muted">Not configured</span>}
            />
          </div>

          <div className="card p-4 lg:p-5">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              Current user
            </h2>
            <FieldRow label="Name" value={user?.name || "Not available"} />
            <FieldRow label="Email" value={user?.email || "Not available"} />
            <FieldRow label="Role" value={role || "Not available"} />
            <FieldRow
              label="Permissions"
              value={<span className="text-muted">Server enforced</span>}
            />
          </div>
        </section>

        <section className="card p-4 lg:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                User and role management
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                User management is hidden until real backend role APIs and
                permission enforcement are available.
              </p>
            </div>
            <span className="pill pill-muted">Not enabled</span>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminSettingsPage;
