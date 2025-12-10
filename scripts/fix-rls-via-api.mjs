import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAndFix() {
  console.log('Checking current database state...\n')
  
  // Test 1: Check if we can query profiles
  console.log('1. Testing profiles table access...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(5)
  
  if (profilesError) {
    console.log('   Error:', profilesError.message)
  } else {
    console.log('   OK - Found', profiles?.length || 0, 'profiles')
    if (profiles) {
      profiles.forEach(p => console.log('   -', p.email))
    }
  }
  
  // Test 2: Check organizations
  console.log('\n2. Testing organizations table access...')
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .limit(5)
  
  if (orgsError) {
    console.log('   Error:', orgsError.message)
  } else {
    console.log('   OK - Found', orgs?.length || 0, 'organizations')
    if (orgs) {
      orgs.forEach(o => console.log('   -', o.name))
    }
  }
  
  // Test 3: Check organization_members
  console.log('\n3. Testing organization_members table access...')
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('id, role, user_id')
    .limit(5)
  
  if (membersError) {
    console.log('   Error:', membersError.message)
  } else {
    console.log('   OK - Found', members?.length || 0, 'members')
  }
  
  // Test 4: Check auth.users (via admin API)
  console.log('\n4. Testing auth users...')
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.log('   Error:', authError.message)
  } else {
    console.log('   OK - Found', authUsers?.users?.length || 0, 'auth users')
    if (authUsers?.users) {
      authUsers.users.forEach(u => console.log('   -', u.email, '| ID:', u.id))
    }
  }
  
  console.log('\n=== Summary ===')
  console.log('If you see "Database error querying schema" during login,')
  console.log('it means the handle_new_user() trigger failed during signup.')
  console.log('')
  console.log('To fix this, please run the SQL in Supabase Dashboard > SQL Editor:')
  console.log('File: supabase/migrations/20241128000000_fix_rls_policies.sql')
  console.log('')
  console.log('Or copy-paste this SQL:')
  console.log('------------------------------------------')
  console.log(`
-- Fix INSERT policy for profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix INSERT policy for organizations  
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (true);

-- Fix INSERT policy for organization_members
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
CREATE POLICY "Users can join organizations" ON organization_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix INSERT policy for categories
DROP POLICY IF EXISTS "Members can create categories" ON categories;
CREATE POLICY "Members can create categories" ON categories
    FOR INSERT WITH CHECK (true);
`)
  console.log('------------------------------------------')
}

checkAndFix()
