-- =====================================================
-- SIMPLE FIX - Tanpa created_by column
-- =====================================================
-- Script ini fix masalah tanpa menggunakan created_by
-- karena kolom tersebut tidak ada di schema
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting simple fix...';
    RAISE NOTICE '========================================';

    FOR user_record IN SELECT id, email FROM auth.users LOOP
        RAISE NOTICE 'Processing: %', user_record.email;

        -- Get organization from organization_members
        SELECT organization_id INTO org_id
        FROM organization_members
        WHERE user_id = user_record.id
        LIMIT 1;

        -- If not found, create new organization
        IF org_id IS NULL THEN
            RAISE NOTICE '  Creating new organization for %', user_record.email;

            INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals)
            VALUES (
                split_part(user_record.email, '@', 1) || '''s Workspace',
                user_record.id::text,
                'free',
                5,
                5
            )
            RETURNING id INTO org_id;

            RAISE NOTICE '  ✅ Created organization: %', org_id;
        END IF;

        -- Ensure user is owner in organization_members
        INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
        VALUES (org_id, user_record.id, 'owner', NOW())
        ON CONFLICT (organization_id, user_id)
        DO UPDATE SET role = 'owner';

        -- Update profile default_organization_id
        UPDATE profiles
        SET default_organization_id = org_id
        WHERE id = user_record.id;

        RAISE NOTICE '  ✅ % is now owner of %', user_record.email, org_id;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Simple fix finished!';
    RAISE NOTICE '========================================';
END $$;

-- Verify hasil
SELECT
    u.email,
    p.default_organization_id IS NOT NULL as "Has Org ID",
    o.name as "Organization Name",
    om.role as "Role",
    CASE
        WHEN p.default_organization_id IS NULL THEN '❌ NO ORG'
        WHEN om.role = 'owner' THEN '✅ OWNER'
        WHEN om.role = 'admin' THEN '⚠️ ADMIN'
        ELSE '❌ MEMBER'
    END as "Status"
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.default_organization_id
LEFT JOIN organization_members om ON om.organization_id = p.default_organization_id AND om.user_id = u.id
ORDER BY u.email;
