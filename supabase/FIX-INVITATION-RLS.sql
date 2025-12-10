-- =====================================================
-- FIX INVITATION RLS POLICIES
-- =====================================================
-- Problem: RLS policy tries to access auth.users table
-- Solution: Use profiles table instead
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invitations to their orgs" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

-- Recreate policies without auth.users access
-- 1. Users can view invitations sent to their email or in their org
CREATE POLICY "Users can view invitations to their orgs" ON invitations
    FOR SELECT USING (
        is_org_admin(organization_id) OR
        email IN (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- 2. Any organization member can create invitations (SaaS model)
CREATE POLICY "Members can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = invitations.organization_id
            AND user_id = auth.uid()
        )
    );

-- 3. Organization members can update invitations
CREATE POLICY "Members can update invitations" ON invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = invitations.organization_id
            AND user_id = auth.uid()
        )
    );

-- 4. Organization members can delete invitations
CREATE POLICY "Members can delete invitations" ON invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = invitations.organization_id
            AND user_id = auth.uid()
        )
    );

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'invitations'
ORDER BY policyname;
