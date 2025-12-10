-- =====================================================
-- Fix RLS Policies for User Signup Flow
-- =====================================================

-- Problem: The handle_new_user() trigger runs as the authenticated user,
-- but RLS policies don't allow INSERT on profiles, organizations, etc.
-- Solution: Add INSERT policies and ensure trigger has proper permissions

-- 1. Allow INSERT on profiles (users can create their own profile on signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Allow INSERT on organizations (for creating personal workspace)
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (true);

-- 3. Allow INSERT on organization_members (for adding self as owner)
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
CREATE POLICY "Users can join organizations" ON organization_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Allow INSERT on categories (for default categories during signup)
DROP POLICY IF EXISTS "Members can create categories" ON categories;
CREATE POLICY "Members can create categories" ON categories
    FOR INSERT WITH CHECK (true);

-- 5. Allow INSERT on transaction_history
DROP POLICY IF EXISTS "Members can view transaction_history" ON transaction_history;
DROP POLICY IF EXISTS "Members can insert transaction_history" ON transaction_history;
CREATE POLICY "Members can view transaction_history" ON transaction_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.id = transaction_id
            AND is_org_member(t.organization_id)
        )
    );
CREATE POLICY "Members can insert transaction_history" ON transaction_history
    FOR INSERT WITH CHECK (changed_by = auth.uid());

-- =====================================================
-- Alternative: Make handle_new_user() bypass RLS
-- The function already has SECURITY DEFINER, but we need to ensure
-- it runs with proper permissions
-- =====================================================

-- Recreate the function with explicit bypass
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
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
    VALUES (new_org_id, NEW.id, 'owner', NOW());
    
    -- Set default organization
    UPDATE public.profiles SET default_organization_id = new_org_id WHERE id = NEW.id;
    
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
