import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrder } from '../contexts/OrderContext';
import { useInventory } from '../contexts/InventoryContext';
import { CookingPot, CreditCard, TrendingUp, ShoppingBag, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, userRole } = useAuth();
  const { orders } = useOrder();
  const { menuItems } = useInventory();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    // Calculate dashboard statistics
    const pendingOrders = orders.filter(order => 
      ['pending', 'paid', 'preparing', 'ready'].includes(order.status)
    ).length;
    
    const completedOrders = orders.filter(order => 
      order.status === 'completed'
    ).length;
    
    const totalRevenue = orders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + order.total_amount, 0);
    
    const lowStockItems = menuItems.filter(item => 
      item.stock_quantity <= 5 && item.stock_quantity > 0
    ).length;

    setStats({
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      totalRevenue,
      lowStockItems
    });
  }, [orders, menuItems]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {userRole?.role} {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingBag size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <CookingPot size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-800">{stats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium uppercase">Order ID</th>
                <th className="py-3 px-6 text-left text-xs font-medium uppercase">Table</th>
                <th className="py-3 px-6 text-left text-xs font-medium uppercase">Customer</th>
                <th className="py-3 px-6 text-left text-xs font-medium uppercase">Status</th>
                <th className="py-3 px-6 text-left text-xs font-medium uppercase">Amount</th>
                <th className="py-3 px-6 text-left text-xs font-medium uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                    {order.id?.slice(0, 8)}...
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    Table {order.table_number}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {order.customer_name}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(order.created_at || '').toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 px-6 text-sm text-gray-500 text-center">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;