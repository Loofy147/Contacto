// app/dashboard/overview/page.tsx
/**
 * Dashboard overview page with KPIs and charts
 * RED TEAM: Test data exposure, permission checks, SQL injection in filters
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { QUERY_KEYS } from '@/lib/constants';
import { formatCurrency, formatRelativeTime } from '@/utils';
import type { DashboardStats } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATS,
    queryFn: () => apiClient.get<DashboardStats>('/dashboard/stats'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card card-body animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Today's Sales",
      value: formatCurrency(stats.todaySales),
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: "Today's Transactions",
      value: stats.todayTransactions.toString(),
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toString(),
      change: `+${stats.newCustomers} this week`,
      isPositive: true,
      icon: Users,
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStockAlerts.toString(),
      change: `${stats.outOfStockAlerts} out of stock`,
      isPositive: false,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {kpi.value}
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    {kpi.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        kpi.isPositive ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg">
                  <kpi.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Sales Trend
            </h2>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center text-gray-400">
              {/* Placeholder for chart - integrate Recharts here */}
              <p>Sales trend chart will be rendered here</p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Selling Products
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {stats.topSellingProducts.slice(0, 5).map((item, index) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <a
            href="/dashboard/sales/history"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </a>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="font-mono text-sm">
                      {transaction.transactionNumber}
                    </td>
                    <td>
                      {transaction.customer ? (
                        <span>
                          {transaction.customer.firstName}{' '}
                          {transaction.customer.lastName}
                        </span>
                      ) : (
                        <span className="text-gray-400">Walk-in customer</span>
                      )}
                    </td>
                    <td className="font-semibold">
                      {formatCurrency(transaction.total)}
                    </td>
                    <td className="capitalize">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="text-sm text-gray-600">
                      {formatRelativeTime(transaction.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          transaction.status === 'completed'
                            ? 'badge-success'
                            : transaction.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockAlerts > 0 && (
        <div className="card border-l-4 border-l-warning">
          <div className="card-body">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Low Stock Alert
                </h3>
                <p className="text-gray-600 mb-3">
                  You have {stats.lowStockAlerts} products running low on stock
                  {stats.outOfStockAlerts > 0 &&
                    `, including ${stats.outOfStockAlerts} that are out of stock`}
                  .
                </p>
                <a
                  href="/dashboard/inventory/stock"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View inventory →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}