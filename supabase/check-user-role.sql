-- Check current user's organization membership and role
-- Replace 'YOUR_EMAIL_HERE' with your actual email

-- 1. Check auth users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'ricky.yusar@gmail.com';

-- 2. Check profiles
SELECT id, email, full_name, default_organization_id
FROM profiles
WHERE email = 'ricky.yusar@gmail.com';

-- 3. Check organization_members
SELECT om.*, o.name as org_name, o.created_by
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id IN (SELECT id FROM auth.users WHERE email = 'ricky.yusar@gmail.com');

-- 4. Check organizations owned by user
SELECT * FROM organizations
WHERE created_by IN (SELECT id FROM auth.users WHERE email = 'ricky.yusar@gmail.com');
