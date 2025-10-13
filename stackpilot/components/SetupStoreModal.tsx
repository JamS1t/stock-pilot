import React, { useState } from "react";

interface SetupStoreModalProps {
  userId: number;
  onStoreSetupComplete: () => void;
  onClose: () => void;
}

const SetupStoreModal: React.FC<SetupStoreModalProps> = ({
  userId,
  onStoreSetupComplete,
  onClose,
}) => {
  const [storeName, setStoreName] = useState("");
  const [timezone, setTimezone] = useState("UTC"); // Default timezone
  const [currency, setCurrency] = useState("PHP"); // Default currency
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/setup-store",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            store_name: storeName,
            timezone: timezone,
            currency: currency,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // console.log('Store setup successful:', data);
        // Assuming the backend returns necessary info or just a success status
        // For now, we'll just call onStoreSetupComplete
        onStoreSetupComplete();
      } else {
        setError(data.message || "Failed to set up store.");
      }
    } catch (err) {
      // console.error('Error during store setup:', err);
      setError("An unexpected error occurred during store setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 font-sans">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">
          Set Up Your Store
        </h2>
        <p className="text-gray-400 text-center">
          Welcome! Please provide some details for your new store.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="storeName"
              className="block text-sm font-medium text-gray-300"
            >
              Store Name
            </label>
            <input
              id="storeName"
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="e.g., My Awesome Shop"
            />
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-300"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              {/* Add more timezone options as needed */}
              <option value="UTC">UTC</option>
              <option value="Asia/Manila">Asia/Manila</option>
              <option value="America/New_York">America/New York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-300"
            >
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              {/* Add more currency options as needed */}
              <option value="PHP">PHP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="ml-2">Setting up...</span>
              </div>
            ) : (
              "Set Up Store"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors mt-2"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupStoreModal;
