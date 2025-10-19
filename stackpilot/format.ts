import { useAuth } from "./context/AuthContext";

// Custom hook to return formatters that depend on store data
export const useFormatters = () => {
  const { store } = useAuth();

  const currency = store?.currency || "PHP";
  const timeZone = store?.timezone || "Asia/Manila";

  // 💰 Currency formatter
  const formatCurrency = (value: number): string => {
    const safeAmount = value ?? 0;
    return safeAmount.toLocaleString(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 🕒 Local date/time formatter
  const formatLocalDate = (utcDate: string | Date): string => {
    const date = new Date(utcDate+"Z");
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  return { formatCurrency, formatLocalDate };
};
