-- =====================================================
-- DEBUG: Check why transactions are not being inserted
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check current user
SELECT auth.uid() as current_user_id;

-- 2. Check user's profile
SELECT * FROM profiles WHERE id = auth.uid();

-- 3. Check user's organization memberships
SELECT 
    om.*,
    o.name as org_name,
    o.slug as org_slug
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = auth.uid();

-- 4. Check if user is member of any organization
SELECT is_org_member(
    (SELECT default_organization_id FROM profiles WHERE id = auth.uid())
) as is_member_of_default_org;

-- 5. List all transactions in user's default organization
SELECT * FROM transactions 
WHERE organization_id = (SELECT default_organization_id FROM profiles WHERE id = auth.uid())
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check RLS policies on transactions table
SELECT 
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions';

-- 7. Test insert (will fail if RLS blocks it, showing the actual error)
-- Uncomment and modify the values to test:
/*
INSERT INTO transactions (
    organization_id,
    amount,
    type,
    description,
    date,
    created_by
) VALUES (
    (SELECT default_organization_id FROM profiles WHERE id = auth.uid()),
    10000,
    'EXPENSE',
    'Test transaction',
    CURRENT_DATE,
    auth.uid()
) RETURNING *;
*/
