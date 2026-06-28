import React, { useEffect, useState } from 'react';
import {
  ShoppingCartIcon,
  PackageIcon,
  ChartBarIcon,
  TagIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
} from './icons';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: string;
}

const primaryNav: NavItem[] = [
  { icon: ShoppingCartIcon, label: 'Counter', page: 'counter' },
  { icon: PackageIcon, label: 'Inventory', page: 'inventory' },
  { icon: UsersIcon, label: 'Suppliers', page: 'suppliers' },
  { icon: ChartBarIcon, label: 'Reports', page: 'reports' },
];

const secondaryNav: NavItem[] = [
  { icon: TagIcon, label: 'Categories', page: 'categories' },
  { icon: ClockIcon, label: 'Order history', page: 'order_history' },
];

const NavLink: React.FC<{
  item: NavItem;
  activePage: string;
  collapsed: boolean;
  onClick: () => void;
}> = ({ item, activePage, collapsed, onClick }) => {
  const isActive = activePage === item.page;
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={`rail-link w-full ${collapsed ? 'justify-center px-0' : ''} ${
        isActive ? 'is-active' : ''
      }`}
    >
      <Icon className="rail-icon" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { user, store, logout } = useAuth();
  const storeName = store?.name || store?.store_name || "Store";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const go = (page: string) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink shadow-card lg:hidden"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`on-ink fixed z-40 flex h-full flex-col bg-ink shadow-rail transition-all duration-300 lg:relative ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-5 pb-5 pt-6 ${collapsed ? 'justify-center px-0' : ''}`}>
          <img src="/stockpilot-logo.png" alt="" width={34} height={34} className="flex-shrink-0" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-lg font-bold tracking-tight text-white">
                StockPilot
              </div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-rail-active">
                Counter&nbsp;AI
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-5 top-7 hidden h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-card transition hover:text-peso lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Store / user card */}
        {store && (
          <div className={`mb-2 px-3 ${collapsed ? 'flex justify-center px-0' : ''}`}>
            {collapsed ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-active/20 font-display text-base font-bold text-rail-active">
                {storeName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
                <div className="truncate text-sm font-semibold text-white">{storeName}</div>
                {user && (
                  <div className="truncate text-xs text-rail-muted">{user.name}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {!collapsed && <p className="px-3 pb-1 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-rail-muted">Counter</p>}
          {primaryNav.map((item) => (
            <NavLink key={item.page} item={item} activePage={activePage} collapsed={collapsed} onClick={() => go(item.page)} />
          ))}

          {!collapsed && <p className="px-3 pb-1 pt-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-rail-muted">Catalog</p>}
          {secondaryNav.map((item) => (
            <NavLink key={item.page} item={item} activePage={activePage} collapsed={collapsed} onClick={() => go(item.page)} />
          ))}
        </nav>

        {/* Connection state */}
        <div className={`px-3 ${collapsed ? 'flex justify-center px-0' : ''}`}>
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
              online ? 'bg-rail-active/15 text-rail-active' : 'bg-utang/20 text-utang-tint'
            } ${collapsed ? 'justify-center px-0' : ''}`}
            title={online ? 'Online — changes sync live' : 'Offline — saving locally'}
          >
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${online ? 'bg-rail-active' : 'animate-pulse-soft bg-utang'}`} />
            {!collapsed && <span>{online ? 'Online' : 'Offline — saving locally'}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 space-y-1 border-t border-white/5 px-3 py-3">
          <NavLink
            item={{ icon: Cog6ToothIcon, label: 'Settings', page: 'settings' }}
            activePage={activePage}
            collapsed={collapsed}
            onClick={() => go('settings')}
          />
          <button
            type="button"
            onClick={logout}
            title={collapsed ? 'Log out' : undefined}
            className={`rail-link w-full hover:bg-danger/15 hover:text-danger-tint ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <ArrowLeftOnRectangleIcon className="rail-icon" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
