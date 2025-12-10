-- =====================================================
-- FORCE UPDATE PROFILES - Update langsung dengan nilai pasti
-- =====================================================

-- Check current state
SELECT
    p.id,
    p.email,
    p.full_name as current_name,
    au.raw_user_meta_data->>'full_name' as metadata_name,
    om.role
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN organization_members om ON om.user_id = p.id
ORDER BY p.created_at DESC;

-- Force update dengan nilai pasti
UPDATE profiles
SET full_name = CASE
    WHEN email LIKE '%rsquareidea.my.id%' THEN 'Ricky Yusar'
    WHEN email LIKE '%gmail.com%' THEN 'Prayasa'
    ELSE full_name
END
WHERE email IN ('ricky.yusar@rsquareidea.my.id', 'ricky.yusar@gmail.com');

-- Verify
SELECT email, full_name, avatar_url
FROM profiles
ORDER BY created_at DESC;
