-- Drop policy if it exists to avoid errors
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Add INSERT policy for organizations table
-- This allows authenticated users to create new organizations
CREATE POLICY "Authenticated users can create organizations" 
ON organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);
