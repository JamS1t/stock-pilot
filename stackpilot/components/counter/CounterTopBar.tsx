import React from "react";

export type CounterOverlay =
  | "none"
  | "charge"
  | "cashDrawer"
  | "stock"
  | "sync"
  | "whoOwes";

export interface CounterTopBarProps {
  todaySales: number;
  expectedCash: number;
  gcashSales: number;
  utangOwed: number;
  isOnline: boolean;
  pendingSync: number;
  formatCurrency: (n: number) => string;
  onOpen: (overlay: CounterOverlay) => void;
}

const CounterTopBar: React.FC<CounterTopBarProps> = ({
  todaySales,
  expectedCash,
  gcashSales,
  utangOwed,
  isOnline,
  pendingSync,
  formatCurrency,
  onOpen,
}) => {
  const cells = [
    { label: "Benta ngayon", value: formatCurrency(todaySales), tone: "text-peso" },
    { label: "Expected cash", value: formatCurrency(expectedCash), tone: "text-ink" },
    { label: "GCash", value: formatCurrency(gcashSales), tone: "text-gcash" },
    { label: "Utang (open)", value: formatCurrency(utangOwed), tone: "text-utang" },
  ];

  return (
    <section className="card animate-fade-in flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:gap-6">
        {cells.map((cell) => (
          <div key={cell.label}>
            <p className="eyebrow">{cell.label}</p>
            <p className={`money mt-1 text-xl font-bold lg:text-2xl ${cell.tone}`}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpen("cashDrawer")}
          className="btn btn-ghost btn-sm"
        >
          Cash drawer
        </button>
        <button
          type="button"
          onClick={() => onOpen("stock")}
          className="btn btn-ghost btn-sm"
        >
          Stock
        </button>
        <button
          type="button"
          onClick={() => onOpen("sync")}
          className={`pill ${pendingSync ? "pill-warn" : "pill-ok"}`}
          title={isOnline ? "Online" : "Offline - saving locally"}
        >
          <span className="pill-dot" />
          {pendingSync ? `${pendingSync} pending` : "Synced"}
        </button>
      </div>
    </section>
  );
};

export default CounterTopBar;
