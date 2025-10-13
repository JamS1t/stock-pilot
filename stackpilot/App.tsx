import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import PosPage from "./pages/PosPage";
import InventoryPage from "./pages/InventoryPage";
import ReportsPage from "./pages/ReportsPage";
import CategoriesPage from "./pages/CategoriesPage";
import SuppliersPage from "./pages/SuppliersPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
// Remove dummy data imports and types that are now fetched within pages
// import { Product, Category, Supplier, Order, OrderItem } from "./types";
// import { PRODUCTS, CATEGORIES, SUPPLIERS, ORDERS } from "./constants";

// Main App component wrapped with AuthProvider
const AppContent: React.FC = () => {
  const { isAuthenticated, logout } = useAuth(); // Use auth context
  const [activePage, setActivePage] = useState("pos");

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
      case "pos":
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
        return <PosPage />; // No props needed
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
      {renderActivePage()}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
