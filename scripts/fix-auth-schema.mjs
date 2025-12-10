import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testLogin() {
  console.log('Testing login with existing user...\n')
  
  // Try to sign in with one of the existing users
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ricky.yusar@rsquareidea.my.id',
    password: 'test123' // This will fail but we can see the error
  })
  
  if (error) {
    console.log('Login error:', error.message)
    console.log('Error code:', error.code)
    console.log('Error status:', error.status)
    
    if (error.message.includes('Database error')) {
      console.log('\n=== DIAGNOSIS ===')
      console.log('The "Database error querying schema" usually means:')
      console.log('1. The auth schema has corrupted or missing tables')
      console.log('2. RLS policies are blocking auth operations')
      console.log('3. The handle_new_user() trigger has errors')
      console.log('')
      console.log('SOLUTION:')
      console.log('Go to Supabase Dashboard > SQL Editor and run:')
      console.log(`
-- 1. Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 2. Check trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- 3. If missing, recreate the trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO public.organizations (name, slug, plan, max_members, max_savings_goals)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
        NEW.id::text,
        'free',
        1,
        1
    )
    RETURNING id INTO new_org_id;
    
    INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());
    
    UPDATE public.profiles SET default_organization_id = new_org_id WHERE id = NEW.id;
    
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
`)
    }
  } else {
    console.log('Login successful!')
    console.log('User:', data.user?.email)
  }
}

testLogin()
