-- =====================================================
-- FIX ALL USER PROFILES - Generic untuk semua user
-- =====================================================
-- Update semua profile yang full_name-nya kosong/Unknown
-- dengan data dari auth.users metadata atau email prefix
-- =====================================================

-- Step 1: Check current state
SELECT
    p.id,
    p.email,
    p.full_name as current_name,
    au.raw_user_meta_data->>'full_name' as metadata_name,
    CASE
        WHEN p.full_name IS NULL OR p.full_name = '' OR p.full_name = 'Unknown'
        THEN '❌ NEEDS FIX'
        ELSE '✅ OK'
    END as status
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;

-- Step 2: Update ALL profiles that have empty/Unknown names
-- Priority: auth metadata > email prefix
UPDATE profiles p
SET
    full_name = COALESCE(
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        NULLIF(p.full_name, ''),
        NULLIF(p.full_name, 'Unknown'),
        split_part(p.email, '@', 1)
    ),
    avatar_url = COALESCE(
        NULLIF(au.raw_user_meta_data->>'avatar_url', ''),
        p.avatar_url
    )
FROM auth.users au
WHERE p.id = au.id
AND (
    p.full_name IS NULL
    OR p.full_name = ''
    OR p.full_name = 'Unknown'
);

-- Step 3: Verify the fix
SELECT
    p.email,
    p.full_name,
    p.avatar_url,
    om.role,
    o.name as organization_name
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
ORDER BY p.created_at DESC;

-- Step 4: Check if any profiles still need fixing
SELECT COUNT(*) as needs_fix_count
FROM profiles
WHERE full_name IS NULL
OR full_name = ''
OR full_name = 'Unknown';
