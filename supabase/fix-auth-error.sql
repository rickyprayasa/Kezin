-- =====================================================
-- SAVERY - Fix "Database error querying schema"
-- =====================================================
-- This script fixes the login error by:
-- 1. Recreating the user trigger with better error handling
-- 2. Fixing any existing users without profiles
-- 3. Creating missing organizations for users
-- =====================================================

-- STEP 1: Drop and recreate the trigger
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create profile (with upsert to handle existing users)
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    -- Check if user already has an organization
    SELECT default_organization_id INTO new_org_id
    FROM public.profiles
    WHERE id = NEW.id;

    -- Only create organization if none exists
    IF new_org_id IS NULL THEN
        -- Create personal organization
        INSERT INTO public.organizations (name, slug, plan, max_members, max_savings_goals)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
            NEW.id::text,
            'free',
            1,
            1
        )
        RETURNING id INTO new_org_id;

        -- Add user as owner
        INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
        VALUES (new_org_id, NEW.id, 'owner', NOW())
        ON CONFLICT (organization_id, user_id) DO NOTHING;

        -- Set default organization
        UPDATE public.profiles
        SET default_organization_id = new_org_id
        WHERE id = NEW.id;

        -- Create default categories
        INSERT INTO public.categories (organization_id, name, type, is_default) VALUES
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
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't prevent user creation
        RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 2: Fix existing users without profiles
-- =====================================================

-- Create profiles for users that don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 3: Fix existing users without organizations
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    FOR user_record IN
        SELECT p.id, p.email, p.full_name
        FROM public.profiles p
        WHERE p.default_organization_id IS NULL
    LOOP
        -- Create organization
        INSERT INTO public.organizations (name, slug, plan, max_members, max_savings_goals)
        VALUES (
            COALESCE(user_record.full_name, split_part(user_record.email, '@', 1)) || '''s Workspace',
            user_record.id::text || '-' || floor(random() * 1000)::text, -- Add random suffix to avoid duplicates
            'free',
            1,
            1
        )
        RETURNING id INTO new_org_id;

        -- Add as owner
        INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
        VALUES (new_org_id, user_record.id, 'owner', NOW())
        ON CONFLICT (organization_id, user_id) DO NOTHING;

        -- Update profile
        UPDATE public.profiles
        SET default_organization_id = new_org_id
        WHERE id = user_record.id;

        -- Create default categories
        INSERT INTO public.categories (organization_id, name, type, is_default) VALUES
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

        RAISE NOTICE 'Fixed user: %', user_record.email;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if all users have profiles
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check if all profiles have organizations
SELECT COUNT(*) as profiles_without_orgs
FROM public.profiles p
WHERE p.default_organization_id IS NULL;

-- If both return 0, the fix was successful!
