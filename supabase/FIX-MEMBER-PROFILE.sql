-- =====================================================
-- COPY DAN RUN DI SUPABASE SQL EDITOR
-- =====================================================
-- Fix 1: Prevent invited users from getting new organization
-- Fix 2: Update existing member profile with correct data
-- =====================================================

-- ============ FIX 1: Update Trigger ============

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create new function that checks for invitations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    has_invitation BOOLEAN;
BEGIN
    -- Create profile first (always needed)
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Check if user has pending invitation
    SELECT EXISTS(
        SELECT 1 FROM invitations
        WHERE email = NEW.email
        AND status = 'pending'
        AND expires_at > NOW()
    ) INTO has_invitation;

    -- Only create organization if user has NO invitation
    IF NOT has_invitation THEN
        INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
            NEW.id::text,
            'free',
            1,
            1
        )
        RETURNING id INTO new_org_id;

        INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
        VALUES (new_org_id, NEW.id, 'owner', NOW());

        UPDATE profiles SET default_organization_id = new_org_id WHERE id = NEW.id;

        -- Create default categories
        INSERT INTO categories (organization_id, name, type, is_default) VALUES
        (new_org_id, 'Salary', 'INCOME', TRUE),
        (new_org_id, 'Freelance', 'INCOME', TRUE),
        (new_org_id, 'Investment', 'INCOME', TRUE),
        (new_org_id, 'Gift', 'INCOME', TRUE),
        (new_org_id, 'Other Income', 'INCOME', TRUE),
        (new_org_id, 'Food', 'EXPENSE', TRUE),
        (new_org_id, 'Transport', 'EXPENSE', TRUE),
        (new_org_id, 'Housing', 'EXPENSE', TRUE),
        (new_org_id, 'Utilities', 'EXPENSE', TRUE),
        (new_org_id, 'Health', 'EXPENSE', TRUE),
        (new_org_id, 'Entertainment', 'EXPENSE', TRUE),
        (new_org_id, 'Shopping', 'EXPENSE', TRUE),
        (new_org_id, 'Other Expense', 'EXPENSE', TRUE);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============ FIX 2: Update Existing Member ============

-- Find the invited member with Unknown name and update from auth.users
UPDATE profiles p
SET
    full_name = COALESCE(
        au.raw_user_meta_data->>'full_name',
        split_part(p.email, '@', 1)
    ),
    avatar_url = COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        p.avatar_url
    )
FROM auth.users au
WHERE p.id = au.id
AND (p.full_name IS NULL OR p.full_name = '' OR p.full_name = 'Unknown');

-- Verify profiles
SELECT
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    om.role,
    o.name as organization_name
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
ORDER BY p.created_at DESC
LIMIT 10;
