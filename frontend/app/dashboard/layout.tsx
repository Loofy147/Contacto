// app/dashboard/layout.tsx
/**
 * Dashboard layout with sidebar navigation
 * RED TEAM: Test auth bypass, permission escalation, CSRF
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { useUIStore } from '@/lib/store';
import { ROUTES } from '@/lib/constants';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Users2,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { isSidebarOpen, isSidebarCollapsed, toggleSidebar, toggleSidebarCollapse } = useUIStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarCollapsed ? 'w-16' : 'w-64'} lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {!isSidebarCollapsed && (
            <Link href={ROUTES.DASHBOARD} className="text-xl font-bold text-primary-600">
              Contacto
            </Link>
          )}
          <button
            onClick={toggleSidebarCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 hidden lg:block"
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-thin">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search products, customers, transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 relative"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

const navigationItems = [
  { href: ROUTES.DASHBOARD_OVERVIEW, label: 'Overview', icon: LayoutDashboard },
  { href: ROUTES.SALES, label: 'Sales', icon: ShoppingCart },
  { href: ROUTES.INVENTORY, label: 'Inventory', icon: Package },
  { href: ROUTES.CUSTOMERS, label: 'Customers', icon: Users },
  { href: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
  { href: ROUTES.TEAM, label: 'Team', icon: Users2 },
  { href: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
];