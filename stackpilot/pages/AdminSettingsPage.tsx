import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getStoreSettings,
  listCashSessions,
  listStoreUsers,
  CashSession,
  StoreRole,
  StoreSettings,
  StoreUser,
  updateStoreSettings,
  updateStoreUserRole,
} from "../utils/api";

const roleLabels: Record<StoreRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
};

const AdminSettingsPage: React.FC = () => {
  const { user, role, updateStore } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [storeUsers, setStoreUsers] = useState<StoreUser[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const canEditSettings = role === "owner" || role === "admin";
  const canManageRoles = role === "owner";

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsResponse, usersResponse, cashSessionsResponse] =
        await Promise.all([
        getStoreSettings(),
        canEditSettings ? listStoreUsers() : Promise.resolve({ data: [] }),
        canEditSettings ? listCashSessions() : Promise.resolve({ data: [] }),
      ]);
      setSettings(settingsResponse.data);
      setStoreUsers(usersResponse.data || []);
      setCashSessions(cashSessionsResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [canEditSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = <K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
  ) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveSettings = async () => {
    if (!settings || saving) return;
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const { store_id, ...payload } = settings;
      const response = await updateStoreSettings(payload);
      setSettings(response.data);
      updateStore({
        store_id: response.data.store_id,
        name: response.data.name,
        timezone: response.data.timezone,
        currency: response.data.currency,
      });
      setStatus("Settings saved.");
    } catch (err: any) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const changeUserRole = async (targetUserId: number, nextRole: StoreRole) => {
    setError(null);
    setStatus(null);
    try {
      await updateStoreUserRole(targetUserId, nextRole);
      setStoreUsers((current) =>
        current.map((storeUser) =>
          storeUser.user_id === targetUserId
            ? { ...storeUser, role: nextRole }
            : storeUser
        )
      );
      setStatus("User role updated.");
    } catch (err: any) {
      setError(err.message || "Unable to update role.");
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="page-inner flex min-h-[60vh] items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-peso"></div>
          <p className="text-sm text-muted">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="page">
        <div className="page-inner flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-danger">{error || "Settings unavailable."}</p>
          <button type="button" onClick={fetchSettings} className="btn btn-primary">
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-inner space-y-4 lg:space-y-5">
        <header className="pl-12 lg:pl-0">
          <p className="eyebrow">Pamamahala</p>
          <h1 className="page-title mt-1">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage store details, receipts, tax behavior, and team access.
          </p>
        </header>

        {(error || status) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-danger/30 bg-danger-tint text-danger"
                : "border-peso/30 bg-peso-tint text-peso-deep"
            }`}
          >
            {error || status}
          </div>
        )}

        <section className="card p-4 lg:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Store profile
              </h2>
              <p className="mt-1 text-sm text-muted">
                These values are served by the backend for this store.
              </p>
            </div>
            {canEditSettings && (
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? "Saving..." : "Save settings"}
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-faint">
                Store name
              </span>
              <input
                value={settings.name}
                onChange={(event) => updateField("name", event.target.value)}
                disabled={!canEditSettings}
                className="field"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-faint">
                Timezone
              </span>
              <input
                value={settings.timezone}
                onChange={(event) => updateField("timezone", event.target.value)}
                disabled={!canEditSettings}
                className="field"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-faint">
                Currency
              </span>
              <input
                value={settings.currency}
                onChange={(event) => updateField("currency", event.target.value)}
                disabled={!canEditSettings}
                className="field"
              />
            </label>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4 lg:p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">
              Receipt
            </h2>
            <div className="space-y-3">
              <input
                value={settings.receipt_name || ""}
                onChange={(event) => updateField("receipt_name", event.target.value)}
                disabled={!canEditSettings}
                placeholder="Receipt name"
                className="field"
              />
              <input
                value={settings.receipt_address || ""}
                onChange={(event) =>
                  updateField("receipt_address", event.target.value)
                }
                disabled={!canEditSettings}
                placeholder="Receipt address"
                className="field"
              />
              <input
                value={settings.receipt_phone || ""}
                onChange={(event) => updateField("receipt_phone", event.target.value)}
                disabled={!canEditSettings}
                placeholder="Receipt phone"
                className="field"
              />
              <textarea
                value={settings.receipt_footer || ""}
                onChange={(event) =>
                  updateField("receipt_footer", event.target.value)
                }
                disabled={!canEditSettings}
                placeholder="Receipt footer"
                className="field min-h-24"
              />
            </div>
          </div>

          <div className="card p-4 lg:p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">
              Tax and counter behavior
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                <span className="text-sm font-semibold text-ink">Tax enabled</span>
                <input
                  type="checkbox"
                  checked={settings.tax_enabled}
                  onChange={(event) =>
                    updateField("tax_enabled", event.target.checked)
                  }
                  disabled={!canEditSettings}
                  className="h-5 w-5"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={settings.tax_label}
                  onChange={(event) => updateField("tax_label", event.target.value)}
                  disabled={!canEditSettings}
                  placeholder="Tax label"
                  className="field"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.tax_rate}
                  onChange={(event) =>
                    updateField("tax_rate", Number(event.target.value))
                  }
                  disabled={!canEditSettings}
                  placeholder="Tax rate"
                  className="field"
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                <span className="text-sm font-semibold text-ink">
                  Require open cash session
                </span>
                <input
                  type="checkbox"
                  checked={settings.require_cash_session}
                  onChange={(event) =>
                    updateField("require_cash_session", event.target.checked)
                  }
                  disabled={!canEditSettings}
                  className="h-5 w-5"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                <span className="text-sm font-semibold text-ink">
                  Allow negative stock
                </span>
                <input
                  type="checkbox"
                  checked={settings.allow_negative_stock}
                  onChange={(event) =>
                    updateField("allow_negative_stock", event.target.checked)
                  }
                  disabled={!canEditSettings}
                  className="h-5 w-5"
                />
              </label>
            </div>
          </div>
        </section>

        {canEditSettings && (
          <section className="card p-4 lg:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Cash session history
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Recent drawer sessions from the backend cash ledger.
                </p>
              </div>
              <span className="pill pill-muted">{cashSessions.length} sessions</span>
            </div>
            {cashSessions.length === 0 ? (
              <p className="text-sm text-muted">No cash sessions recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Opened</th>
                      <th scope="col">Closed</th>
                      <th scope="col" className="text-right">Opening</th>
                      <th scope="col" className="text-right">Expected</th>
                      <th scope="col" className="text-right">Actual</th>
                      <th scope="col" className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashSessions.slice(0, 8).map((session) => (
                      <tr key={session.cash_session_id}>
                        <td className="text-muted">{session.opened_at}</td>
                        <td className="text-muted">{session.closed_at || "-"}</td>
                        <td className="money text-right">{session.opening_cash}</td>
                        <td className="money text-right">
                          {session.expected_cash ?? "-"}
                        </td>
                        <td className="money text-right">
                          {session.actual_cash ?? "-"}
                        </td>
                        <td className="text-center">
                          <span
                            className={
                              session.status === "open"
                                ? "pill pill-ok"
                                : "pill pill-muted"
                            }
                          >
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <section className="card p-4 lg:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                User and role management
              </h2>
              <p className="mt-1 text-sm text-muted">
                Roles are enforced by the backend for settings and role updates.
              </p>
            </div>
            <span className="pill pill-muted">{roleLabels[(role as StoreRole) || "staff"] || role}</span>
          </div>

          {!canEditSettings ? (
            <p className="text-sm text-muted">
              Your role can view store settings but cannot manage users.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Email</th>
                    <th scope="col" className="text-center">Status</th>
                    <th scope="col" className="text-center">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {storeUsers.map((storeUser) => (
                    <tr key={storeUser.user_id}>
                      <td className="font-semibold text-ink">
                        {storeUser.name || "Unnamed user"}
                        {storeUser.user_id === user?.user_id && (
                          <span className="ml-2 text-xs text-faint">You</span>
                        )}
                      </td>
                      <td className="text-muted">{storeUser.email}</td>
                      <td className="text-center">
                        <span className={storeUser.is_active ? "pill pill-ok" : "pill pill-bad"}>
                          {storeUser.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-center">
                        {canManageRoles ? (
                          <select
                            value={storeUser.role}
                            onChange={(event) =>
                              changeUserRole(
                                storeUser.user_id,
                                event.target.value as StoreRole
                              )
                            }
                            className="field field-sm mx-auto w-32"
                          >
                            {(["owner", "admin", "staff"] as StoreRole[]).map(
                              (nextRole) => (
                                <option key={nextRole} value={nextRole}>
                                  {roleLabels[nextRole]}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <span className="pill pill-muted">
                            {roleLabels[storeUser.role]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminSettingsPage;
