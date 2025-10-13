// A simple utility to format numbers as currency strings with commas.
export const formatCurrency = (value: number): string => {
  const safeAmount = value ?? 0;
    return `₱${safeAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};
