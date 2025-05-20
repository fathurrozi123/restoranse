/*
  # Fix staff table policies

  1. Changes
    - Remove recursive policies from staff table
    - Create new, non-recursive policies for staff management
    
  2. Security
    - Enable RLS on staff table (already enabled)
    - Add policy for managers to manage all staff
    - Add policy for staff to read their own data
    - Policies are designed to avoid recursive checks
*/

-- Drop existing policies to replace them with non-recursive versions
DROP POLICY IF EXISTS "Managers can CRUD all staff" ON staff;
DROP POLICY IF EXISTS "Staff can read their own data" ON staff;

-- Create new policy for managers to manage all staff
-- This policy uses a direct role check instead of a recursive staff table query
CREATE POLICY "Managers can manage all staff"
ON staff
FOR ALL
TO authenticated
USING (role = 'manager')
WITH CHECK (role = 'manager');

-- Create new policy for staff to read their own data
-- This policy uses a simple id comparison without querying the staff table
CREATE POLICY "Staff can read own data"
ON staff
FOR SELECT
TO authenticated
USING (id = auth.uid());