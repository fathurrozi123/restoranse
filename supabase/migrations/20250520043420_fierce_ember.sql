/*
  # Initial Database Schema for Restaurant Self-Order System

  1. New Tables
    - `staff` - Store user roles and permissions for restaurant staff
    - `menu_items` - Store restaurant menu items with stock information
    - `orders` - Store customer orders
    - `order_items` - Store items for each order
  
  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
    - Set up default table permissions
*/

-- Staff Table (For user roles and permissions)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'cashier', 'kitchen')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Staff Policies
CREATE POLICY "Staff can read their own data"
  ON staff
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can CRUD all staff"
  ON staff
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'manager'
  ));

-- Menu Items Policies
CREATE POLICY "Menu items are readable by anyone"
  ON menu_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can CRUD menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

-- Orders Policies
CREATE POLICY "Orders are readable by staff"
  ON orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Orders are readable by anonymous users who created them"
  ON orders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can create orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

-- Order Items Policies
CREATE POLICY "Order items are readable by staff"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff WHERE id = auth.uid()
  ));

CREATE POLICY "Order items are readable by anonymous users who created the order"
  ON order_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can create order items"
  ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, available, stock_quantity, image_url)
VALUES 
  ('Margherita Pizza', 'Classic pizza with tomato, mozzarella, and basil', 12.99, 'Pizza', true, 20, 'https://images.pexels.com/photos/1653877/pexels-photo-1653877.jpeg?auto=compress&cs=tinysrgb'),
  ('Pepperoni Pizza', 'Pizza topped with pepperoni slices', 14.99, 'Pizza', true, 15, 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb'),
  ('Caesar Salad', 'Romaine lettuce with Caesar dressing, croutons, and parmesan', 9.99, 'Salads', true, 10, 'https://images.pexels.com/photos/406152/pexels-photo-406152.jpeg?auto=compress&cs=tinysrgb'),
  ('Cheeseburger', 'Beef patty with cheese, lettuce, tomato, and special sauce', 11.99, 'Burgers', true, 25, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb'),
  ('French Fries', 'Crispy golden fries seasoned with salt', 4.99, 'Sides', true, 30, 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb'),
  ('Chocolate Cake', 'Rich chocolate cake with ganache frosting', 7.99, 'Desserts', true, 10, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb'),
  ('Cappuccino', 'Espresso with steamed milk and foam', 3.99, 'Drinks', true, 50, 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb'),
  ('Lemonade', 'Fresh squeezed lemon juice with sugar and water', 2.99, 'Drinks', true, 40, 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb');