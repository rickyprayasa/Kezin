-- =====================================================
-- COPY SELURUH SCRIPT INI DAN JALANKAN DI SUPABASE SQL EDITOR
-- =====================================================

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view invitations to their orgs" ON invitations;

-- Create new public SELECT policy
CREATE POLICY "Public can view invitations by token" ON invitations
    FOR SELECT USING (TRUE);

-- Verify the new policy
SELECT
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'invitations';
