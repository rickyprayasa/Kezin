-- =====================================================
-- FIX: Allow users to join organization via invitation
-- =====================================================
-- Problem: Current RLS policy blocks INSERT to organization_members
-- because user needs to be admin, but user isn't a member yet!
-- Solution: Add policy to allow users with valid invitation to join

-- Step 1: Drop existing restrictive policy for organization_members INSERT
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

-- Step 2: Create helper function to check valid invitation
CREATE OR REPLACE FUNCTION has_valid_invitation(org_id UUID, user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM invitations 
        WHERE organization_id = org_id 
        AND email = user_email
        AND status = 'pending'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create separate policies for each operation

-- Admins can SELECT all members
CREATE POLICY "Members can view org members" ON organization_members 
FOR SELECT USING (is_org_member(organization_id));

-- Users can INSERT themselves if they have valid invitation OR if admin is adding them
CREATE POLICY "Users can join via invitation" ON organization_members 
FOR INSERT WITH CHECK (
    -- User is adding themselves with a valid invitation
    (user_id = auth.uid() AND has_valid_invitation(organization_id, (SELECT email FROM auth.users WHERE id = auth.uid())))
    OR
    -- Admin is adding someone
    is_org_admin(organization_id)
);

-- Admins can UPDATE members
CREATE POLICY "Admins can update members" ON organization_members 
FOR UPDATE USING (is_org_admin(organization_id));

-- Admins can DELETE members (but not themselves if owner)
CREATE POLICY "Admins can delete members" ON organization_members 
FOR DELETE USING (is_org_admin(organization_id) AND user_id != auth.uid());

-- Step 4: Verify the fix
SELECT 'Policies created successfully!' as status;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'organization_members';
