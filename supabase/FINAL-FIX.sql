-- =====================================================
-- FINAL FIX - Lengkap dengan create profiles
-- =====================================================
-- Script ini fix semua masalah:
-- 1. Create profiles jika belum ada
-- 2. Create organizations jika belum ada
-- 3. Set user sebagai owner
-- 4. Set default_organization_id
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
    profile_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting final fix...';
    RAISE NOTICE '========================================';

    FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
        RAISE NOTICE 'Processing: %', user_record.email;

        -- Step 1: Ensure profile exists
        SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_record.id) INTO profile_exists;

        IF NOT profile_exists THEN
            RAISE NOTICE '  Creating profile for %', user_record.email;

            INSERT INTO profiles (id, email, full_name)
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(
                    user_record.raw_user_meta_data->>'full_name',
                    split_part(user_record.email, '@', 1)
                )
            );

            RAISE NOTICE '  ✅ Profile created';
        END IF;

        -- Step 2: Get or create organization
        SELECT organization_id INTO org_id
        FROM organization_members
        WHERE user_id = user_record.id
        LIMIT 1;

        IF org_id IS NULL THEN
            RAISE NOTICE '  Creating organization for %', user_record.email;

            INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals)
            VALUES (
                split_part(user_record.email, '@', 1) || '''s Workspace',
                user_record.id::text,
                'free',
                5,
                5
            )
            RETURNING id INTO org_id;

            RAISE NOTICE '  ✅ Organization created: %', org_id;
        END IF;

        -- Step 3: Set as owner in organization_members
        INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
        VALUES (org_id, user_record.id, 'owner', NOW())
        ON CONFLICT (organization_id, user_id)
        DO UPDATE SET role = 'owner';

        RAISE NOTICE '  ✅ Set as owner in organization_members';

        -- Step 4: Update profile default_organization_id
        UPDATE profiles
        SET default_organization_id = org_id
        WHERE id = user_record.id;

        RAISE NOTICE '  ✅ % is now owner of % (org: %)', user_record.email, org_id, split_part(user_record.email, '@', 1) || '''s Workspace';
        RAISE NOTICE '  ----------------------------------------';
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
END $$;

-- Verify hasil - ini akan menampilkan semua user dengan organization mereka
SELECT
    u.email as "Email",
    CASE
        WHEN p.id IS NULL THEN '❌ NO PROFILE'
        ELSE '✅ Has Profile'
    END as "Profile Status",
    CASE
        WHEN p.default_organization_id IS NULL THEN '❌ NO ORG'
        ELSE '✅ Has Org'
    END as "Org Status",
    o.name as "Organization",
    om.role as "Role",
    CASE
        WHEN p.default_organization_id IS NULL THEN '❌ NEEDS FIX'
        WHEN om.role = 'owner' THEN '✅ READY'
        WHEN om.role = 'admin' THEN '⚠️ ADMIN'
        ELSE '❌ MEMBER'
    END as "Overall Status"
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.default_organization_id
LEFT JOIN organization_members om ON om.organization_id = p.default_organization_id AND om.user_id = u.id
ORDER BY u.email;
