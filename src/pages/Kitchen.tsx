import React, { useState } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { Clock, Check, Loader2 } from 'lucide-react';

const Kitchen: React.FC = () => {
  const { orders, updateOrderStatus } = useOrder();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filter orders that are relevant for kitchen
  const kitchenOrders = orders.filter(order => 
    ['paid', 'preparing', 'ready'].includes(order.status)
  );

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: 'preparing' | 'ready' | 'completed') => {
    await updateOrderStatus(orderId, newStatus);
  };

  const renderStatusButton = (order: any) => {
    switch (order.status) {
      case 'paid':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'preparing')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm flex items-center"
          >
            <Clock size={18} className="mr-1" />
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'ready')}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm flex items-center"
          >
            <Loader2 size={18} className="mr-1" />
            Mark as Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, 'completed')}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm flex items-center"
          >
            <Check size={18} className="mr-1" />
            Mark as Completed
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kitchen Dashboard</h1>
        <p className="text-gray-600">Manage food orders and preparation status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kitchenOrders.length > 0 ? (
          kitchenOrders.map(order => (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                order.status === 'paid' ? 'border-orange-500' :
                order.status === 'preparing' ? 'border-yellow-500' :
                'border-blue-500'
              }`}
            >
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">Order #{order.id?.slice(0, 8)}</span>
                    <h3 className="font-medium">Table {order.table_number}</h3>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'paid' ? 'bg-orange-100 text-orange-800' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'paid' ? 'New Order' : 
                       order.status === 'preparing' ? 'Preparing' : 'Ready'}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-1">
                  Customer: <span className="font-medium">{order.customer_name}</span>
                </p>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <span className="bg-gray-100 text-gray-700 rounded-full w-5 h-5 inline-flex items-center justify-center mr-2">
                            {item.quantity}
                          </span>
                          <span>{item.menu_item?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => toggleOrderExpand(order.id!)}
                  className="text-sm text-blue-600 mb-3 inline-block"
                >
                  {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                </button>

                {expandedOrder === order.id && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm space-y-2">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                        <div className="font-medium">{item.menu_item?.name} x{item.quantity}</div>
                        {item.special_instructions && (
                          <div className="mt-1 text-gray-700 bg-yellow-50 p-2 rounded">
                            <span className="font-medium">Note:</span> {item.special_instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2">
                  {renderStatusButton(order)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 bg-white rounded-lg shadow">
            <div className="flex flex-col items-center">
              <CookingPot size={48} className="text-gray-300 mb-3" />
              <h3 className="text-gray-500 text-lg">No active orders</h3>
              <p className="text-gray-400 text-sm">New orders will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { CookingPot } from 'lucide-react';

export default Kitchen;