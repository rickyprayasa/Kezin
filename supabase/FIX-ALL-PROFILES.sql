-- =====================================================
-- FIX ALL PROFILES - Update semua profile yang belum lengkap
-- =====================================================

-- Step 1: Check current profiles status
SELECT
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    au.raw_user_meta_data->>'full_name' as metadata_name,
    om.role,
    o.name as organization_name
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
ORDER BY p.created_at DESC;

-- Step 2: Update ALL profiles with missing or empty names
UPDATE profiles p
SET
    full_name = COALESCE(
        au.raw_user_meta_data->>'full_name',
        p.full_name,
        split_part(p.email, '@', 1)
    ),
    avatar_url = COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        p.avatar_url
    )
FROM auth.users au
WHERE p.id = au.id
AND (
    p.full_name IS NULL
    OR p.full_name = ''
    OR p.full_name = 'Unknown'
    OR p.full_name = split_part(p.email, '@', 1)  -- Also update if name is just email prefix
);

-- Step 3: Verify the fix
SELECT
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    om.role,
    o.name as organization_name
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
ORDER BY p.created_at DESC;
