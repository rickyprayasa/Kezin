-- =====================================================
-- QUICK FIX - Jalankan ini langsung di SQL Editor
-- =====================================================
-- Script ini akan:
-- 1. Memastikan semua users jadi owner
-- 2. Verifikasi hasilnya
-- =====================================================

-- Step 1: Fix all users to be owners
DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        -- Get default organization
        SELECT default_organization_id INTO org_id
        FROM profiles WHERE id = user_record.id;

        IF org_id IS NOT NULL THEN
            -- Upsert as owner
            INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
            VALUES (org_id, user_record.id, 'owner', NOW())
            ON CONFLICT (organization_id, user_id)
            DO UPDATE SET role = 'owner';

            -- Set created_by
            UPDATE organizations SET created_by = user_record.id WHERE id = org_id;

            RAISE NOTICE '✅ % is now owner', user_record.email;
        END IF;
    END LOOP;
END $$;

-- Step 2: Verify results
SELECT
    u.email,
    o.name as organization,
    om.role,
    CASE
        WHEN om.role = 'owner' THEN '✅ OWNER'
        WHEN om.role = 'admin' THEN '⚠️ ADMIN'
        ELSE '❌ MEMBER'
    END as status
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY u.email;
