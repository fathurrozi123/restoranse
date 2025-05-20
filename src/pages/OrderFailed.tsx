import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const OrderFailed: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <XCircle size={64} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          We were unable to process your payment. Your order has not been placed. Please try again or
          choose a different payment method.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Return to Cart
          </button>
          <Link
            to="/qr-scanner"
            className="text-orange-500 hover:text-orange-600"
          >
            Scan a Different QR Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderFailed;