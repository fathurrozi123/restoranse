import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  CookingPot, 
  Receipt, 
  Package, 
  Users, 
  LogOut,
  ChefHat
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { signOut, userRole, isManager } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center px-4 py-3 text-sm ${
      isActive 
        ? 'bg-orange-100 text-orange-700 font-medium rounded-md' 
        : 'text-gray-700 hover:bg-gray-100 rounded-md'
    }`;

  return (
    <div className="w-64 h-full bg-white shadow-md flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <ChefHat size={32} className="text-orange-500" />
          <h1 className="ml-2 text-2xl font-bold text-gray-800">FoodHub</h1>
        </div>
        <div className="py-2 px-4 bg-gray-100 rounded-md text-center">
          <p className="text-sm font-medium text-gray-700">Logged in as</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">{userRole?.role}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard size={18} className="mr-3" />
          Dashboard
        </NavLink>

        <NavLink to="/kitchen" className={navLinkClass}>
          <CookingPot size={18} className="mr-3" />
          Kitchen
        </NavLink>

        <NavLink to="/cashier" className={navLinkClass}>
          <Receipt size={18} className="mr-3" />
          Cashier
        </NavLink>

        <NavLink to="/inventory" className={navLinkClass}>
          <Package size={18} className="mr-3" />
          Inventory
        </NavLink>

        {isManager && (
          <NavLink to="/users" className={navLinkClass}>
            <Users size={18} className="mr-3" />
            Users
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={signOut}
          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <LogOut size={18} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;