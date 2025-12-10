-- =====================================================
-- SIMPLE FIX - Update owner profile langsung
-- =====================================================

-- Method 1: Update owner yang email-nya ricky.yusar@rsquareidea.my.id
UPDATE profiles
SET full_name = 'Ricky Yusar'
WHERE email = 'ricky.yusar@rsquareidea.my.id';

-- Method 2: Update semua profile yang full_name = 'Unknown'
UPDATE profiles
SET full_name = CASE
    WHEN email = 'ricky.yusar@rsquareidea.my.id' THEN 'Ricky Yusar'
    WHEN email = 'ricky.yusar@gmail.com' THEN 'Prayasa'
    ELSE split_part(email, '@', 1)
END
WHERE full_name = 'Unknown' OR full_name IS NULL OR full_name = '';

-- Verify the fix
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
