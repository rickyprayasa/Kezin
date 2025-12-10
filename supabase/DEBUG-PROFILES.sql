-- =====================================================
-- DEBUG: Check profile data
-- =====================================================

-- Check auth.users data
SELECT
    id,
    email,
    raw_user_meta_data->>'full_name' as metadata_full_name,
    raw_user_meta_data->>'avatar_url' as metadata_avatar_url,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check profiles data
SELECT
    id,
    email,
    full_name,
    avatar_url,
    default_organization_id,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- Check organization_members with profiles
SELECT
    om.id as member_id,
    om.role,
    om.user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    o.name as organization_name
FROM organization_members om
LEFT JOIN profiles p ON p.id = om.user_id
LEFT JOIN organizations o ON o.id = om.organization_id
ORDER BY om.created_at DESC;

-- Check if there are duplicate users
SELECT email, COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;
