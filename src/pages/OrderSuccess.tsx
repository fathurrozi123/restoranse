import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">
          Your order has been received and is being prepared by our kitchen. You can track the 
          status of your order on this screen.
        </p>
        <div className="py-4 px-6 bg-green-50 rounded-lg mb-6">
          <h2 className="font-medium text-gray-800 mb-2">Order Status</h2>
          <div className="flex items-center justify-center space-x-2">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-green-700 font-medium">Paid</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Check back later to see when your order is ready!
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/qr-scanner"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Scan Another QR Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;