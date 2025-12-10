import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixDatabase() {
  console.log('=== Fixing Database Issues ===\n')

  // 1. Drop and recreate the trigger with proper error handling
  console.log('1. Recreating handle_new_user trigger with better error handling...')

  const fixTriggerSQL = `
-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function with better error handling and explicit schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create profile
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
`

  const { error: triggerError } = await supabase.rpc('exec_sql', { sql: fixTriggerSQL })

  if (triggerError) {
    console.log('   Note: exec_sql RPC not available. You need to run this SQL manually in Supabase Dashboard.')
    console.log('   Error:', triggerError.message)
    console.log('\n=== SQL TO RUN MANUALLY ===')
    console.log(fixTriggerSQL)
    console.log('=== END SQL ===\n')
  } else {
    console.log('   ✓ Trigger recreated successfully')
  }

  // 2. Check for existing users without profiles
  console.log('\n2. Checking for orphaned users...')

  const checkOrphanedSQL = `
SELECT COUNT(*) as orphaned_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
`

  console.log('   Run this in Supabase SQL Editor to check for orphaned users:')
  console.log(checkOrphanedSQL)

  // 3. Provide fix for existing users
  console.log('\n3. If you have existing users without profiles, run this:')

  const fixOrphanedSQL = `
-- Fix existing users without profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create organizations for users without one
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
            user_record.id::text,
            'free',
            1,
            1
        )
        RETURNING id INTO new_org_id;

        -- Add as owner
        INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
        VALUES (new_org_id, user_record.id, 'owner', NOW());

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
`

  console.log(fixOrphanedSQL)

  console.log('\n=== INSTRUCTIONS ===')
  console.log('1. Go to Supabase Dashboard: https://app.supabase.com')
  console.log('2. Select your project')
  console.log('3. Go to SQL Editor')
  console.log('4. Create a new query and paste the SQL above')
  console.log('5. Run the query')
  console.log('6. Wait a few seconds for the changes to propagate')
  console.log('7. Try logging in again')
  console.log('\nAlternatively, if the issue persists:')
  console.log('- Go to Settings > Database > Reset Database')
  console.log('- Or restart the project: Settings > General > Restart Project')
}

fixDatabase()
