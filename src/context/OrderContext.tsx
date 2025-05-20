import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../App';
import { useAuth } from './AuthContext';
import { MenuItem } from './InventoryContext';
import toast from 'react-hot-toast';

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  quantity: number;
  special_instructions: string;
  menu_item?: MenuItem;
}

export interface Order {
  id?: string;
  table_number: number;
  customer_name: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  payment_id?: string | null;
  payment_status?: 'pending' | 'paid' | 'failed';
  created_at?: string;
  items: OrderItem[];
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  cartItems: OrderItem[];
  loading: boolean;
  setCartItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  addToCart: (item: MenuItem, quantity: number, specialInstructions: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  updateCartItemInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  createOrder: (tableNumber: number, customerName: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  getOrderDetails: (orderId: string) => Promise<Order | null>;
  refreshOrders: () => Promise<void>;
  fetchOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user, userRole } = useAuth();

  // Fetch orders when user logs in or role changes
  useEffect(() => {
    if (user && userRole) {
      fetchOrders();
    }
  }, [user, userRole]);

  // Setup real-time subscription for orders
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(
          data.map(async (order) => {
            const { data: items, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                *,
                menu_item:menu_item_id (*)
              `)
              .eq('order_id', order.id);

            if (itemsError) {
              console.error('Error fetching order items:', itemsError);
              return { ...order, items: [] };
            }

            return { ...order, items: items || [] };
          })
        );

        setOrders(ordersWithItems);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem, quantity: number, specialInstructions: string = '') => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.menu_item_id === item.id
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          special_instructions: specialInstructions || updatedItems[existingItemIndex].special_instructions
        };
        return updatedItems;
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            menu_item_id: item.id,
            quantity,
            special_instructions: specialInstructions,
            menu_item: item
          }
        ];
      }
    });

    toast.success(`${quantity} ${item.name} added to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.menu_item_id !== itemId)
    );
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.menu_item_id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartItemInstructions = (itemId: string, instructions: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.menu_item_id === itemId ? { ...item, special_instructions: instructions } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCurrentOrder(null);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.menu_item?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const createOrder = async (tableNumber: number, customerName: string): Promise<Order | null> => {
    try {
      if (cartItems.length === 0) {
        toast.error('Your cart is empty');
        return null;
      }

      const totalAmount = calculateTotal();

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            table_number: tableNumber,
            customer_name: customerName,
            status: 'pending',
            total_amount: totalAmount,
            payment_status: 'pending'
          }
        ])
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      if (!orderData) {
        throw new Error('Failed to create order');
      }

      // Insert order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_instructions: item.special_instructions
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Set current order
      const newOrder: Order = {
        ...orderData,
        items: cartItems
      };
      
      setCurrentOrder(newOrder);
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getOrderDetails = async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            menu_item:menu_item_id (*)
          `)
          .eq('order_id', orderId);

        if (itemsError) {
          throw itemsError;
        }

        return { ...data, items: items || [] };
      }

      return null;
    } catch (error) {
      console.error('Error fetching order details:', error);
      return null;
    }
  };

  const refreshOrders = async () => {
    await fetchOrders();
  };

  const value = {
    orders,
    currentOrder,
    cartItems,
    loading,
    setCartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateCartItemInstructions,
    clearCart,
    calculateTotal,
    createOrder,
    updateOrderStatus,
    getOrderDetails,
    refreshOrders,
    fetchOrders
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};