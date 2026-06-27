import React, { Suspense, lazy, useState } from "react";
import Sidebar from "./components/Sidebar";
import CounterDashboard from "./pages/CounterDashboard";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
// Remove dummy data imports and types that are now fetched within pages
// import { Product, Category, Supplier, Order, OrderItem } from "./types";
// import { PRODUCTS, CATEGORIES, SUPPLIERS, ORDERS } from "./constants";

const PosPage = lazy(() => import("./pages/PosPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));

const PageFallback: React.FC = () => (
  <main className="flex flex-1 items-center justify-center bg-gray-900 text-sky-400">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-sky-500" />
  </main>
);

// Main App component wrapped with AuthProvider
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth(); // Use auth context
  const [activePage, setActivePage] = useState("counter");

  // Data state is now managed within individual page components or context
  // const [products, setProducts] = useState<Product[]>(PRODUCTS);
  // const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  // const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  // const [orders, setOrders] = useState<Order[]>(ORDERS);
  // const [cart, setCart] = useState<OrderItem[]>([]);

  // --- Handlers ---
  // All handlers for data manipulation are now within their respective page components

  const renderActivePage = () => {
    switch (activePage) {
      case "counter":
        return <CounterDashboard setActivePage={setActivePage} />;
      case "legacy_pos":
        return <PosPage />; // No props needed
      case "inventory":
        return <InventoryPage />; // No props needed
      case "reports":
        return <ReportsPage />; // No props needed
      case "categories":
        return <CategoriesPage />; // No props needed
      case "suppliers":
        return <SuppliersPage />; // No props needed
      case "order_history":
        return <OrderHistoryPage />; // No props needed
      case "settings":
        return <AdminSettingsPage />;
      default:
        return <CounterDashboard setActivePage={setActivePage} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />; // No onLogin prop needed
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        // onLogout prop is no longer needed
      />
      <Suspense fallback={<PageFallback />}>{renderActivePage()}</Suspense>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
