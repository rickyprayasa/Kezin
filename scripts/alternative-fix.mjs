import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function alternativeFix() {
  console.log('=== Alternative Fix - Deep Diagnosis ===\n')

  console.log('1. Testing basic database connection...')

  // Test if we can query profiles table
  const { data: profilesTest, error: profilesError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1)

  if (profilesError) {
    console.log('   ❌ Cannot query profiles:', profilesError.message)
    console.log('   → Database might be down or RLS is blocking')
  } else {
    console.log('   ✅ Can query profiles table')
  }

  // Test if we can query organizations
  const { data: orgsTest, error: orgsError } = await supabase
    .from('organizations')
    .select('count')
    .limit(1)

  if (orgsError) {
    console.log('   ❌ Cannot query organizations:', orgsError.message)
  } else {
    console.log('   ✅ Can query organizations table')
  }

  console.log('\n2. Checking auth configuration...')

  // Check auth settings via API
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseServiceKey
      }
    })

    const settings = await response.json()
    console.log('   Auth settings:', JSON.stringify(settings, null, 2))
  } catch (e) {
    console.log('   ⚠️  Cannot fetch auth settings:', e.message)
  }

  console.log('\n3. Possible issues and solutions:')
  console.log('')
  console.log('   Issue A: Auth schema corruption')
  console.log('   → Solution: Restart Supabase project')
  console.log('   → Link: https://app.supabase.com/project/tpkzeewyrzlepmpalyca/settings/general')
  console.log('')
  console.log('   Issue B: Trigger is still broken')
  console.log('   → Solution: Check if trigger exists in database')
  console.log('   → Run this SQL to check:')
  console.log('     SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';')
  console.log('')
  console.log('   Issue C: RLS policies blocking auth operations')
  console.log('   → Solution: Temporarily disable RLS on profiles table')
  console.log('   → Run this SQL:')
  console.log('     ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;')
  console.log('')
  console.log('   Issue D: Database needs restart')
  console.log('   → Solution: Pause and restore project')
  console.log('')

  console.log('\n4. RECOMMENDED: Delete user and sign up again')
  console.log('')
  console.log('   This is the cleanest solution:')
  console.log('   a) Go to: https://app.supabase.com/project/tpkzeewyrzlepmpalyca/auth/users')
  console.log('   b) Find user: ricky.yusar@rsquareidea.my.id')
  console.log('   c) Click on user → Delete user')
  console.log('   d) Go to: http://localhost:3000/signup')
  console.log('   e) Sign up with same email')
  console.log('   f) Login!')
  console.log('')

  console.log('\n5. Creating alternative SQL fix...')
  console.log('   If trigger is the issue, try removing it completely:')
  console.log('')
  console.log('   Run this in Supabase SQL Editor:')
  console.log(`
-- Remove trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now the trigger won't interfere with auth
-- You'll need to manually create profiles after signup
  `)

  console.log('\n=== Action Plan ===')
  console.log('')
  console.log('Try these in order:')
  console.log('')
  console.log('1. RESTART PROJECT (Easiest)')
  console.log('   → https://app.supabase.com/project/tpkzeewyrzlepmpalyca/settings/general')
  console.log('   → Click "Pause project" → Wait → Click "Restore project"')
  console.log('   → Wait 2-3 minutes → Test login')
  console.log('')
  console.log('2. DELETE USER & RE-SIGNUP (Most Reliable)')
  console.log('   → Delete existing user in dashboard')
  console.log('   → Sign up again at /signup page')
  console.log('')
  console.log('3. DISABLE TRIGGER (If above fails)')
  console.log('   → Run SQL above to remove trigger')
  console.log('   → Test login')
  console.log('')
  console.log('4. CONTACT SUPABASE SUPPORT (Last resort)')
  console.log('   → https://supabase.com/dashboard/support/new')
  console.log('   → Describe "Database error querying schema" on login')
  console.log('')
}

alternativeFix()
