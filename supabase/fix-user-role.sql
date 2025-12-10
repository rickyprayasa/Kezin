-- Fix user role to owner
-- Replace the email with your actual email

DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'ricky.yusar@gmail.com';

    -- Get user's default organization
    SELECT default_organization_id INTO v_org_id
    FROM profiles
    WHERE id = v_user_id;

    -- Check if organization_members record exists
    IF EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = v_user_id AND organization_id = v_org_id
    ) THEN
        -- Update existing record to owner
        UPDATE organization_members
        SET role = 'owner'
        WHERE user_id = v_user_id AND organization_id = v_org_id;

        RAISE NOTICE 'Updated user role to owner';
    ELSE
        -- Insert new record as owner
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (v_org_id, v_user_id, 'owner');

        RAISE NOTICE 'Created new organization_members record as owner';
    END IF;

    -- Update organization created_by to ensure ownership
    UPDATE organizations
    SET created_by = v_user_id
    WHERE id = v_org_id;

END $$;

-- Verify the fix
SELECT
    u.email,
    o.name as organization_name,
    om.role,
    om.created_at as member_since
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE u.email = 'ricky.yusar@gmail.com';
