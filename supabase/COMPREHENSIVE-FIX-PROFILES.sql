-- =====================================================
-- COMPREHENSIVE FIX FOR ALL USER PROFILES
-- =====================================================
-- This script will fix all user profiles across the entire SaaS
-- Updates profiles where full_name is NULL, empty, or 'Unknown'
-- Priority: auth metadata > email prefix
-- =====================================================

-- Step 1: Check current state of ALL profiles
SELECT
    p.id,
    p.email,
    p.full_name as current_name,
    au.raw_user_meta_data->>'full_name' as metadata_name,
    au.raw_user_meta_data->>'avatar_url' as metadata_avatar,
    CASE
        WHEN p.full_name IS NULL OR p.full_name = '' OR p.full_name = 'Unknown'
        THEN '❌ NEEDS FIX'
        ELSE '✅ OK'
    END as status
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;

-- Step 2: Update ALL profiles with invalid names
-- This works for ANY user in the system, not specific emails
UPDATE profiles p
SET
    full_name = COALESCE(
        -- Try to get name from auth metadata first
        NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
        -- If that's empty, try current full_name if it's not 'Unknown'
        CASE
            WHEN p.full_name IS NOT NULL AND p.full_name != '' AND p.full_name != 'Unknown'
            THEN p.full_name
            ELSE NULL
        END,
        -- Last resort: use email prefix (before @)
        split_part(p.email, '@', 1)
    ),
    avatar_url = COALESCE(
        -- Try to get avatar from auth metadata
        NULLIF(TRIM(au.raw_user_meta_data->>'avatar_url'), ''),
        -- Keep existing avatar if valid
        CASE
            WHEN p.avatar_url IS NOT NULL AND p.avatar_url != ''
            THEN p.avatar_url
            ELSE NULL
        END
    )
FROM auth.users au
WHERE p.id = au.id
AND (
    p.full_name IS NULL
    OR TRIM(p.full_name) = ''
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

-- Step 4: Count how many profiles still need fixing
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' OR full_name = 'Unknown' THEN 1 END) as needs_fix,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' AND full_name != 'Unknown' THEN 1 END) as fixed
FROM profiles;

-- Step 5: Show any profiles that still need manual attention
SELECT
    id,
    email,
    full_name,
    avatar_url
FROM profiles
WHERE full_name IS NULL
   OR TRIM(full_name) = ''
   OR full_name = 'Unknown'
ORDER BY created_at DESC;
