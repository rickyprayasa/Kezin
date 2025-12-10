-- =====================================================
-- CHECK PROFILE DATA - Debug kenapa masih Unknown
-- =====================================================

-- Step 1: Cek data di auth.users
SELECT
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'full_name' as meta_fullname,
    raw_user_meta_data->>'avatar_url' as meta_avatar,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Cek data di profiles setelah update
SELECT
    id,
    email,
    full_name,
    avatar_url,
    created_at,
    LENGTH(full_name) as name_length,
    CASE
        WHEN full_name IS NULL THEN 'NULL'
        WHEN full_name = '' THEN 'EMPTY STRING'
        WHEN full_name = 'Unknown' THEN 'UNKNOWN'
        WHEN TRIM(full_name) = '' THEN 'WHITESPACE ONLY'
        ELSE 'VALID: ' || full_name
    END as name_status
FROM profiles
ORDER BY created_at DESC;

-- Step 3: Join untuk lihat mismatch
SELECT
    p.id,
    p.email,
    p.full_name as profile_name,
    au.raw_user_meta_data->>'full_name' as auth_meta_name,
    split_part(p.email, '@', 1) as email_prefix,
    om.role,
    CASE
        WHEN p.full_name IS NULL OR p.full_name = '' OR p.full_name = 'Unknown'
        THEN 'SHOULD UPDATE TO: ' || COALESCE(au.raw_user_meta_data->>'full_name', split_part(p.email, '@', 1))
        ELSE 'OK'
    END as fix_recommendation
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN organization_members om ON om.user_id = p.id
ORDER BY p.created_at DESC;
