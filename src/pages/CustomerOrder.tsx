import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import { useOrder } from '../contexts/OrderContext';
import { MenuItem } from '../contexts/InventoryContext';
import { Plus, Minus, ShoppingCart, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Midtrans type
interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

const CustomerOrder: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [processingPayment, setProcessingPayment] = useState(false);

  const { 
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    calculateTotal,
    createOrder
  } = useOrder();

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('available', true)
          .order('category')
          .order('name');

        if (error) {
          throw error;
        }

        if (data) {
          setMenuItems(data);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(data.map(item => item.category))];
          setCategories(uniqueCategories);
          
          if (uniqueCategories.length > 0) {
            setSelectedCategory(uniqueCategories[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      setShowNamePrompt(false);
    } else {
      toast.error('Please enter your name');
    }
  };

  const openItemModal = (item: MenuItem) => {
    setCurrentItem(item);
    setItemQuantity(1);
    setSpecialInstructions('');
  };

  const closeItemModal = () => {
    setCurrentItem(null);
    setItemQuantity(1);
    setSpecialInstructions('');
  };

  const handleAddToCart = () => {
    if (currentItem && itemQuantity > 0) {
      addToCart(currentItem, itemQuantity, specialInstructions);
      closeItemModal();
    }
  };

  const toggleCart = () => {
    setShowCart(!showCart);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!tableId) {
      toast.error('Invalid table number');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Create order in database
      const order = await createOrder(parseInt(tableId), customerName);
      
      if (!order || !order.id) {
        throw new Error('Failed to create order');
      }

      // Call Midtrans API via edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          order_id: order.id,
          amount: order.total_amount,
          customer_name: customerName,
          items: order.items.map(item => ({
            id: item.menu_item_id,
            name: item.menu_item?.name || 'Menu item',
            price: item.menu_item?.price || 0,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Payment creation failed');
      }

      const paymentData: MidtransSnapResponse = await response.json();
      
      // Update order with payment ID
      await supabase
        .from('orders')
        .update({ payment_id: paymentData.token })
        .eq('id', order.id);

      // Open Midtrans Snap
      (window as any).snap.pay(paymentData.token, {
        onSuccess: async function() {
          // Update payment status to paid
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid',
              status: 'paid'
            })
            .eq('id', order.id);
            
          clearCart();
          navigate('/order-success');
        },
        onPending: function() {
          toast.info('Payment is pending');
        },
        onError: async function() {
          // Update payment status to failed
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', order.id);
            
          navigate('/order-failed');
        },
        onClose: function() {
          setProcessingPayment(false);
          toast.info('Payment window closed');
        }
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Midtrans script */}
      <script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={import.meta.env.VITE_MIDTRANS_CLIENT_KEY}
      ></script>

      {/* Name prompt */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Welcome to Our Restaurant</h2>
            <p className="mb-4">Please enter your name to continue</p>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-orange-500 text-white font-medium py-2 px-4 rounded-md hover:bg-orange-600"
              >
                Continue to Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Food Hub</h1>
            <p className="text-sm text-gray-600">Table {tableId}</p>
          </div>
          <button
            onClick={toggleCart}
            className="relative p-2 bg-orange-500 text-white rounded-full"
          >
            <ShoppingCart size={20} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto py-2 px-4 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 mx-1 whitespace-nowrap text-sm font-medium rounded-full ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto p-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading menu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems
              .filter((item) => item.category === selectedCategory)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => openItemModal(item)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-orange-500">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{item.stock_quantity} left</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Item Modal */}
      {currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="h-48 overflow-hidden relative">
              <img
                src={currentItem.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb'}
                alt={currentItem.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={closeItemModal}
                className="absolute top-2 right-2 bg-white rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-xl text-gray-800">{currentItem.name}</h3>
              <p className="text-gray-600 my-2">{currentItem.description}</p>
              <p className="font-bold text-lg text-orange-500 mb-4">
                ${currentItem.price.toFixed(2)}
              </p>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Special Instructions</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any allergies or preferences?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="p-2 bg-gray-100 rounded-l-md"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 bg-gray-100 text-center w-12">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity(Math.min(20, itemQuantity + 1))}
                    className="p-2 bg-gray-100 rounded-r-md"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="font-medium">
                  ${(currentItem.price * itemQuantity).toFixed(2)}
                </p>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-orange-500 text-white font-medium py-3 px-4 rounded-md hover:bg-orange-600"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button onClick={toggleCart}>
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <ShoppingCart size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.menu_item_id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{item.menu_item?.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${item.menu_item?.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${((item.menu_item?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {item.special_instructions && (
                      <p className="text-sm text-gray-600 mb-2 bg-gray-100 p-2 rounded">
                        {item.special_instructions}
                      </p>
                    )}

                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => updateCartItemQuantity(item.menu_item_id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.menu_item_id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-t">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || processingPayment}
                className="w-full bg-orange-500 text-white font-medium py-3 px-4 rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processingPayment ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrder;