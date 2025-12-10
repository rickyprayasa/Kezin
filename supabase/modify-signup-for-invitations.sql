-- =====================================================
-- MODIFY SIGNUP FLOW FOR INVITED USERS
-- =====================================================
-- Create a new trigger that:
-- 1. Checks if user was invited
-- 2. If invited: Add to existing org (NO new org creation)
-- 3. If not invited: Create new org (normal flow)
-- =====================================================

-- Create the smart signup handler
CREATE OR REPLACE FUNCTION public.handle_new_user_with_invitation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    invitation_record RECORD;
    user_was_invited BOOLEAN;
BEGIN
    -- Check if user was invited
    SELECT EXISTS (
        SELECT 1 FROM invitations
        WHERE email = NEW.email
        AND status = 'pending'
        AND expires_at > NOW()
    ) INTO user_was_invited;

    -- Always create profile first
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

    IF user_was_invited THEN
        -- User was invited - join existing organization
        RAISE NOTICE 'User % was invited, adding to existing org', NEW.email;

        -- Get invitation details
        SELECT * INTO invitation_record
        FROM invitations
        WHERE email = NEW.email
        AND status = 'pending'
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1;

        IF invitation_record.id IS NOT NULL THEN
            -- Add user to organization as member
            INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
            VALUES (invitation_record.organization_id, NEW.id, invitation_record.role, NOW())
            ON CONFLICT (organization_id, user_id) DO NOTHING;

            -- Set default organization
            UPDATE public.profiles
            SET default_organization_id = invitation_record.organization_id
            WHERE id = NEW.id;

            -- Mark invitation as accepted
            UPDATE invitations
            SET status = 'accepted',
                accepted_at = NOW()
            WHERE id = invitation_record.id;

            RAISE NOTICE 'User % added to organization %', NEW.email, invitation_record.organization_id;
        END IF;

    ELSE
        -- User was NOT invited - create new organization (normal flow)
        RAISE NOTICE 'User % signing up normally, creating new org', NEW.email;

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

        RAISE NOTICE 'Created new organization % for user %', new_org_id, NEW.email;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user_with_invitation for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_invitation();

-- Verification
SELECT 'Smart signup trigger created successfully!' as status;
