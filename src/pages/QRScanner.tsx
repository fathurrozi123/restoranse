import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';

const QRScanner: React.FC = () => {
  const [tableNumber, setTableNumber] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber.trim()) {
      navigate(`/order/${tableNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <QrCode size={64} className="text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">QR Code Test</h1>
        <p className="text-gray-600 mb-6 text-center">
          In a real environment, you would scan a QR code to access the ordering system. 
          For testing purposes, please enter a table number below.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Table Number
            </label>
            <input
              id="tableNumber"
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter table number"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Go to Order Page
          </button>
        </form>
      </div>
    </div>
  );
};

export default QRScanner;