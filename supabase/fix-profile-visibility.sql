-- =====================================================
-- Fix Profile Visibility for Organization Members
-- =====================================================
-- This fixes the issue where team members see "UNKNOWN" 
-- instead of actual names in the dashboard.
--
-- Problem: The existing RLS policy only allows users to 
-- view their own profile, blocking the query when trying 
-- to display other team members' information.
--
-- Solution: Add a policy that allows organization members 
-- to view profiles of other members in the same organization.
-- =====================================================

-- Allow organization members to view profiles of other members in their organization
CREATE POLICY "Org members can view member profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om1
    INNER JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = profiles.id
  )
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
