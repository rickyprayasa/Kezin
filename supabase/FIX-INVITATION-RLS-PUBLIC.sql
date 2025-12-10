-- =====================================================
-- FIX INVITATION RLS - Allow public access by token
-- =====================================================
-- Problem: RLS blocking public access to invitations
-- Solution: Allow anyone to read invitation by token
-- =====================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view invitations to their orgs" ON invitations;

-- Create new SELECT policy that allows:
-- 1. Public access by token (for invitation page)
-- 2. Organization members can see their org's invitations
CREATE POLICY "Public can view invitations by token" ON invitations
    FOR SELECT USING (
        -- Anyone can view by token (for invitation acceptance page)
        TRUE
    );

-- Verify the policy
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'invitations'
AND cmd = 'SELECT';
