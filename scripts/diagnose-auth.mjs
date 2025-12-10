import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnose() {
  console.log('=== Supabase Auth Diagnosis ===\n')
  
  // 1. Test basic connection
  console.log('1. Testing basic connection...')
  const { data: testData, error: testError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1)
  
  if (testError) {
    console.log('   Connection error:', testError.message)
  } else {
    console.log('   Connection OK')
  }
  
  // 2. Try to get user by email using admin API
  console.log('\n2. Checking auth.users via RPC...')
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_auth_users_count')
  
  if (rpcError) {
    console.log('   RPC not available (expected):', rpcError.message)
  } else {
    console.log('   RPC result:', rpcData)
  }
  
  // 3. Check if there's an issue with auth schema
  console.log('\n3. Attempting to use auth admin API...')
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('   Auth admin API OK')
      console.log('   Users found:', result.users?.length || 0)
    } else {
      console.log('   Auth admin API error:', result.message || result.error || JSON.stringify(result))
      console.log('   Status:', response.status)
    }
  } catch (e) {
    console.log('   Fetch error:', e.message)
  }
  
  // 4. Check GoTrue health
  console.log('\n4. Checking GoTrue health...')
  try {
    const healthResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        'apikey': supabaseServiceKey
      }
    })
    const health = await healthResponse.json()
    console.log('   Health status:', JSON.stringify(health))
  } catch (e) {
    console.log('   Health check error:', e.message)
  }
  
  console.log('\n=== Recommendations ===')
  console.log('If auth is still failing, try these in Supabase Dashboard:')
  console.log('')
  console.log('1. Go to Authentication > Users and check if users exist')
  console.log('2. Go to Database > Tables and verify auth.users table exists')
  console.log('3. Try restarting the project: Settings > General > Restart Project')
  console.log('4. Check Supabase logs: Logs > Auth')
  console.log('')
  console.log('Run this SQL to check auth schema:')
  console.log(`
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth';
`)
}

diagnose()
