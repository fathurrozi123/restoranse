import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { OrderProvider } from './contexts/OrderContext';

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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Please connect to Supabase using the "Connect to Supabase" button in the top right corner.'
  );
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
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