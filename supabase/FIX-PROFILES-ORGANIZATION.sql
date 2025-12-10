-- =====================================================
-- FIX PROFILES - Set default_organization_id
-- =====================================================
-- Masalah: profile.default_organization_id is NULL
-- Solusi: Set default_organization_id dari organization_members
-- =====================================================

-- Step 1: Update profiles yang belum punya default_organization_id
UPDATE profiles p
SET default_organization_id = om.organization_id
FROM organization_members om
WHERE p.id = om.user_id
AND p.default_organization_id IS NULL
AND om.role = 'owner';

-- Step 2: Jika masih ada yang NULL, ambil organization manapun yang user jadi member
UPDATE profiles p
SET default_organization_id = (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = p.id
    ORDER BY created_at DESC
    LIMIT 1
)
WHERE default_organization_id IS NULL
AND EXISTS (
    SELECT 1 FROM organization_members WHERE user_id = p.id
);

-- Step 3: Verify hasilnya
SELECT
    u.email,
    p.default_organization_id,
    o.name as organization_name,
    om.role,
    CASE
        WHEN p.default_organization_id IS NULL THEN '❌ NULL'
        ELSE '✅ OK'
    END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN organizations o ON o.id = p.default_organization_id
LEFT JOIN organization_members om ON om.organization_id = p.default_organization_id AND om.user_id = p.id
ORDER BY u.email;
