-- =====================================================
-- COMPLETE FIX - Jalankan ini untuk fix semua masalah
-- =====================================================
-- Script all-in-one untuk fix:
-- 1. Users jadi owner
-- 2. Profiles punya default_organization_id
-- 3. Organizations punya created_by
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting complete fix...';
    RAISE NOTICE '========================================';

    FOR user_record IN SELECT id, email FROM auth.users LOOP
        RAISE NOTICE 'Processing: %', user_record.email;

        -- Get organization from organization_members where user is owner
        SELECT organization_id INTO org_id
        FROM organization_members
        WHERE user_id = user_record.id
        AND role = 'owner'
        LIMIT 1;

        -- If not found, get any organization
        IF org_id IS NULL THEN
            SELECT organization_id INTO org_id
            FROM organization_members
            WHERE user_id = user_record.id
            ORDER BY created_at DESC
            LIMIT 1;
        END IF;

        -- If still NULL, user might not have organization yet
        IF org_id IS NULL THEN
            RAISE NOTICE '  ⚠️  % has no organization!', user_record.email;

            -- Create organization for this user
            INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals, created_by)
            VALUES (
                split_part(user_record.email, '@', 1) || '''s Workspace',
                user_record.id::text,
                'free',
                5,
                5,
                user_record.id
            )
            RETURNING id INTO org_id;

            RAISE NOTICE '  ✅ Created new organization: %', org_id;
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

        -- Update organization created_by
        UPDATE organizations
        SET created_by = user_record.id
        WHERE id = org_id;

        RAISE NOTICE '  ✅ % is now owner of %', user_record.email, org_id;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Complete fix finished!';
    RAISE NOTICE '========================================';
END $$;

-- Verify hasil
SELECT
    u.email,
    p.default_organization_id IS NOT NULL as has_org,
    o.name as organization,
    om.role,
    CASE
        WHEN p.default_organization_id IS NULL THEN '❌ NO ORG'
        WHEN om.role = 'owner' THEN '✅ OWNER'
        WHEN om.role = 'admin' THEN '⚠️ ADMIN'
        ELSE '❌ MEMBER'
    END as status
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.default_organization_id
LEFT JOIN organization_members om ON om.organization_id = p.default_organization_id AND om.user_id = u.id
ORDER BY u.email;
