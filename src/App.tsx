import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { OrderProvider } from './contexts/OrderContext';
import LoadingScreen from './components/LoadingScreen';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerOrder from './pages/CustomerOrder';
import ProtectedRoute from './components/ProtectedRoute';
import QRScanner from './pages/QRScanner';
import Kitchen from './pages/Kitchen';
import Cashier from './pages/Cashier';
import InventoryManagement from './pages/InventoryManagement';
import UserManagement from './pages/UserManagement';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailed from './pages/OrderFailed';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        setIsLoading(true);
        // Test the connection by making a simple query
        const { error } = await supabase
          .from('menu_items')
          .select('count')
          .single();

        if (error && error.message !== 'JSON object requested, multiple (or no) rows returned') {
          throw error;
        }

        setIsSupabaseReady(true);
      } catch (error) {
        console.error('Supabase connection error:', error);
        // Keep trying to connect
        setTimeout(checkSupabaseConnection, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    checkSupabaseConnection();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isSupabaseReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to connect to the database. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <InventoryProvider>
          <OrderProvider>
            <Toaster position="top-center" />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/order/:tableId" element={<CustomerOrder />} />
              <Route path="/qr-scanner" element={<QRScanner />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order-failed" element={<OrderFailed />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/kitchen" element={<Kitchen />} />
                <Route path="/cashier" element={<Cashier />} />
                <Route path="/inventory" element={<InventoryManagement />} />
                <Route path="/users" element={<UserManagement />} />
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </OrderProvider>
        </InventoryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;