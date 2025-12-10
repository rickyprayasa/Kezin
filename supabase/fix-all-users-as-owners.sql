-- =====================================================
-- FIX ALL EXISTING USERS TO BE OWNERS
-- =====================================================
-- This script ensures all users who created their own
-- organization are set as 'owner' role
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    org_record RECORD;
BEGIN
    -- Loop through all users
    FOR user_record IN
        SELECT id, email FROM auth.users
    LOOP
        RAISE NOTICE 'Processing user: %', user_record.email;

        -- Get user's default organization
        SELECT default_organization_id INTO org_record
        FROM profiles
        WHERE id = user_record.id;

        -- Check if user has a default organization
        IF org_record.default_organization_id IS NOT NULL THEN
            -- Check if organization_members record exists
            IF EXISTS (
                SELECT 1 FROM organization_members
                WHERE user_id = user_record.id
                AND organization_id = org_record.default_organization_id
            ) THEN
                -- Update to owner if they're the only member or if organization was created by them
                UPDATE organization_members
                SET role = 'owner'
                WHERE user_id = user_record.id
                AND organization_id = org_record.default_organization_id
                AND (
                    -- They're the only member
                    (SELECT COUNT(*) FROM organization_members WHERE organization_id = org_record.default_organization_id) = 1
                    OR
                    -- Organization name contains their email/name
                    (SELECT name FROM organizations WHERE id = org_record.default_organization_id) LIKE '%' || split_part(user_record.email, '@', 1) || '%'
                );

                RAISE NOTICE 'Updated user % to owner in organization %', user_record.email, org_record.default_organization_id;
            ELSE
                -- Insert as owner if no record exists
                INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
                VALUES (org_record.default_organization_id, user_record.id, 'owner', NOW())
                ON CONFLICT (organization_id, user_id) DO NOTHING;

                RAISE NOTICE 'Created owner record for user % in organization %', user_record.email, org_record.default_organization_id;
            END IF;

            -- Update organizations table to set created_by
            UPDATE organizations
            SET created_by = user_record.id
            WHERE id = org_record.default_organization_id
            AND created_by IS NULL;
        ELSE
            RAISE NOTICE 'User % has no default organization', user_record.email;
        END IF;
    END LOOP;

    RAISE NOTICE 'All users processed successfully!';
END $$;

-- Verify the results
SELECT
    u.email,
    o.name as organization_name,
    om.role,
    om.created_at as member_since,
    CASE
        WHEN om.role = 'owner' THEN '✅ Owner'
        WHEN om.role = 'admin' THEN '⚠️ Admin'
        ELSE '❌ Member'
    END as status
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY u.email, om.role;
