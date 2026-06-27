import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const NavLink: React.FC<{
  icon: React.ElementType;
  label: string;
  pageName: string;
  activePage: string;
  onClick: () => void;
  isCollapsed: boolean;
}> = ({ icon: Icon, label, pageName, activePage, onClick, isCollapsed }) => {
  const isActive = activePage === pageName;
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-sky-500/20 text-sky-400 font-semibold'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
      title={isCollapsed ? label : ''}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { user, store, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg border border-gray-700 hover:bg-gray-800"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-gray-900 text-white flex flex-col p-4 border-r border-gray-800 transition-all duration-300 fixed lg:relative h-full z-40 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } relative`}
      >
        {/* Logo + App Name */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-6 p-2`}>
          <img src="/stockpilot-logo.png" alt="Logo" width="40" className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-2xl font-bold tracking-tight">
              Stock<span className="text-sky-400">Pilot</span>
            </span>
          )}
        </div>

        {/* Desktop Collapse Toggle - Positioned absolutely */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center absolute -right-3 top-8 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full text-gray-400 hover:text-sky-400 hover:border-sky-400 transition-all duration-200 shadow-lg hover:shadow-sky-400/20"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* User and Store Info */}
        {user && store && !isCollapsed && (
          <div className="mb-8 bg-gray-800/50 rounded-xl p-3 text-sm border border-gray-700">
            <div className="font-semibold text-sky-400 truncate">{store.name}</div>
            <div className="text-gray-300 truncate mt-1">{user.name}</div>
            <div className="text-gray-500 truncate text-xs">{user.email}</div>
          </div>
        )}

        {/* Collapsed User Icon */}
        {user && store && isCollapsed && (
          <div className="mb-8 flex justify-center">
            <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-400 font-bold">
              {store.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavLink icon={ShoppingCartIcon} label="Counter" pageName="counter" activePage={activePage} onClick={() => { setActivePage('counter'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
          <NavLink icon={PackageIcon} label="Inventory" pageName="inventory" activePage={activePage} onClick={() => { setActivePage('inventory'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
          <NavLink icon={ChartBarIcon} label="Reports" pageName="reports" activePage={activePage} onClick={() => { setActivePage('reports'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
          <NavLink icon={TagIcon} label="Categories" pageName="categories" activePage={activePage} onClick={() => { setActivePage('categories'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
          <NavLink icon={UsersIcon} label="Suppliers" pageName="suppliers" activePage={activePage} onClick={() => { setActivePage('suppliers'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
          <NavLink icon={ClockIcon} label="Order History" pageName="order_history" activePage={activePage} onClick={() => { setActivePage('order_history'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
        </nav>

        {/* Footer Links */}
        <div className="mt-auto space-y-2">
          <NavLink icon={Cog6ToothIcon} label="Settings" pageName="settings" activePage={activePage} onClick={() => { setActivePage('settings'); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
          <NavLink icon={ArrowLeftOnRectangleIcon} label="Logout" pageName="logout" activePage={activePage} onClick={() => { logout(); setIsMobileOpen(false); }} isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
