import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../App';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
  stock_quantity: number;
  created_at: string;
}

interface InventoryContextType {
  menuItems: MenuItem[];
  categories: string[];
  loading: boolean;
  updateStockQuantity: (id: string, quantity: number) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'created_at'>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setMenuItems(data);
        const uniqueCategories = [...new Set(data.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    } catch (error: any) {
      console.error('Error fetching menu items:', error.message);
      toast.error(`Failed to load menu items: ${error.message}`);
      // Set empty arrays to prevent undefined errors
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu items on mount and when user changes
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Set up real-time subscription for menu items
  useEffect(() => {
    const subscription = supabase
      .channel('menu_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' }, 
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateStockQuantity = async (id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          stock_quantity: quantity,
          available: quantity > 0 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.id === id
            ? { ...item, stock_quantity: quantity, available: quantity > 0 }
            : item
        )
      );

      toast.success('Stock updated successfully');
    } catch (error: any) {
      console.error('Error updating stock:', error.message);
      toast.error(`Failed to update stock: ${error.message}`);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([item])
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setMenuItems(prevItems => [...prevItems, data[0]]);
        
        if (!categories.includes(item.category)) {
          setCategories(prevCategories => [...prevCategories, item.category]);
        }
        
        toast.success('Menu item added successfully');
      }
    } catch (error: any) {
      console.error('Error adding menu item:', error.message);
      toast.error(`Failed to add menu item: ${error.message}`);
    }
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update(item)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMenuItems(prevItems =>
        prevItems.map(menuItem =>
          menuItem.id === id ? { ...menuItem, ...item } : menuItem
        )
      );

      // Update categories if the category changed
      if (item.category) {
        const allCategories = menuItems.map(mi => 
          mi.id === id ? item.category! : mi.category
        );
        const uniqueCategories = [...new Set(allCategories)];
        setCategories(uniqueCategories);
      }

      toast.success('Menu item updated successfully');
    } catch (error: any) {
      console.error('Error updating menu item:', error.message);
      toast.error(`Failed to update menu item: ${error.message}`);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      const updatedItems = menuItems.filter(item => item.id !== id);
      setMenuItems(updatedItems);

      // Update categories if needed
      const remainingCategories = [...new Set(updatedItems.map(item => item.category))];
      setCategories(remainingCategories);

      toast.success('Menu item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting menu item:', error.message);
      toast.error(`Failed to delete menu item: ${error.message}`);
    }
  };

  const refreshInventory = async () => {
    await fetchMenuItems();
  };

  const value = {
    menuItems,
    categories,
    loading,
    updateStockQuantity,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refreshInventory,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};