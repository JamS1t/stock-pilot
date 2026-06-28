import React, { useState } from "react";
import DialogFrame from "./DialogFrame";

interface SetupStoreModalProps {
  userId: number;
  onStoreSetupComplete: (storeData: {
    user_id: number;
    store_name: string;
    timezone: string;
    currency: string;
  }) => void;
  onClose: () => void;
}

const SetupStoreModal: React.FC<SetupStoreModalProps> = ({
  userId,
  onStoreSetupComplete,
  onClose,
}) => {
  const [storeName, setStoreName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Manila"); // Default to Philippines timezone
  const [currency, setCurrency] = useState("PHP"); // Default currency
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const storeData = {
      user_id: userId,
      store_name: storeName,
      timezone: timezone,
      currency: currency,
    };

    try {
      // Pass the store data to the parent component
      // The parent will handle the actual API call
      onStoreSetupComplete(storeData);
    } catch (err) {
      setError("An unexpected error occurred during store setup.");
      setLoading(false);
    }
  };

  return (
    <DialogFrame onClose={onClose} closeOnBackdrop={false}>
        <div className="text-center">
          <p className="eyebrow">Welcome sa StockPilot</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">
            Set up your store
          </h2>
          <p className="mt-2 text-sm text-muted">
            A few details to get your counter ready. You can change these later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="storeName" className="field-label">
              Store name
            </label>
            <input
              id="storeName"
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="field"
              placeholder="e.g., Aling Nena Store"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="field-label">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="field"
            >
              <option value="Asia/Manila">Asia/Manila (PHT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="field-label">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="field"
            >
              <option value="PHP">PHP (₱)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="SGD">SGD (S$)</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-tint px-3.5 py-3 text-center text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span>
                  Setting up…
                </span>
              ) : (
                "Set up store"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost w-full"
            >
              Cancel
            </button>
          </div>
        </form>
    </DialogFrame>
  );
};

export default SetupStoreModal;
