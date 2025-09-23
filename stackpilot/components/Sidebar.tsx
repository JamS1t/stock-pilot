
import React from 'react';
import {
  ShoppingCartIcon,
  PackageIcon,
  ChartBarIcon,
  TagIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon
} from './icons';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
}

const NavLink: React.FC<{
  icon: React.ElementType;
  label: string;
  pageName: string;
  activePage: string;
  onClick: () => void;
}> = ({ icon: Icon, label, pageName, activePage, onClick }) => {
  const isActive = activePage === pageName;
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-sky-500/20 text-sky-400 font-semibold'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onLogout }) => {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col p-4 border-r border-gray-800">
      <div className="flex items-center space-x-3 mb-10 p-2">
          <img src="/stockpilot-logo.png" alt="Logo" width="40" />
          <span className="text-2xl font-bold tracking-tight">Stock<span className="text-sky-400">Pilot</span></span>
      </div>
      <nav className="flex-1 space-y-2">
        <NavLink icon={ShoppingCartIcon} label="POS" pageName="pos" activePage={activePage} onClick={() => setActivePage('pos')} />
        <NavLink icon={PackageIcon} label="Inventory" pageName="inventory" activePage={activePage} onClick={() => setActivePage('inventory')} />
        <NavLink icon={ChartBarIcon} label="Reports" pageName="reports" activePage={activePage} onClick={() => setActivePage('reports')} />
        <NavLink icon={TagIcon} label="Categories" pageName="categories" activePage={activePage} onClick={() => setActivePage('categories')} />
        <NavLink icon={UsersIcon} label="Suppliers" pageName="suppliers" activePage={activePage} onClick={() => setActivePage('suppliers')} />
        <NavLink icon={ClockIcon} label="Order History" pageName="order_history" activePage={activePage} onClick={() => setActivePage('order_history')} />
      </nav>
      <div className="mt-auto space-y-2">
        <NavLink icon={Cog6ToothIcon} label="Settings" pageName="settings" activePage={activePage} onClick={() => setActivePage('settings')} />
        <NavLink icon={ArrowLeftOnRectangleIcon} label="Logout" pageName="logout" activePage={activePage} onClick={onLogout} />
      </div>
    </aside>
  );
};

export default Sidebar;