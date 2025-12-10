import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAndFixUser() {
  console.log('=== Checking User Data ===\n')

  const testEmail = 'ricky.yusar@rsquareidea.my.id'

  // 1. Check if user exists in auth.users
  console.log('1. Checking auth.users...')
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.log('   ❌ Error listing users:', error.message)
      return
    }

    const user = users.find(u => u.email === testEmail)

    if (!user) {
      console.log(`   ❌ User ${testEmail} not found in auth.users`)
      console.log('   → You need to sign up first!')
      return
    }

    console.log(`   ✅ User found in auth.users`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Created: ${user.created_at}`)

    // 2. Check if profile exists
    console.log('\n2. Checking profiles...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('   ❌ Profile NOT found - Creating now...')

        // Create profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0]
          })
          .select()
          .single()

        if (createError) {
          console.log('   ❌ Error creating profile:', createError.message)
          return
        }

        console.log('   ✅ Profile created successfully!')
      } else {
        console.log('   ❌ Error checking profile:', profileError.message)
        return
      }
    } else {
      console.log('   ✅ Profile exists')
      console.log(`   Full name: ${profile.full_name}`)
      console.log(`   Default org: ${profile.default_organization_id || 'NOT SET'}`)
    }

    // 3. Check if organization exists
    console.log('\n3. Checking organization...')

    const { data: refreshedProfile } = await supabase
      .from('profiles')
      .select('default_organization_id')
      .eq('id', user.id)
      .single()

    if (!refreshedProfile?.default_organization_id) {
      console.log('   ❌ Organization NOT found - Creating now...')

      // Create organization
      const orgName = (user.user_metadata?.full_name || user.email.split('@')[0]) + "'s Workspace"
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: user.id,
          plan: 'free',
          max_members: 1,
          max_savings_goals: 1
        })
        .select()
        .single()

      if (orgError) {
        console.log('   ❌ Error creating organization:', orgError.message)
        return
      }

      console.log('   ✅ Organization created:', newOrg.id)

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
          accepted_at: new Date().toISOString()
        })

      if (memberError) {
        console.log('   ⚠️  Warning: Error adding member:', memberError.message)
      } else {
        console.log('   ✅ User added as owner')
      }

      // Update profile with default organization
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ default_organization_id: newOrg.id })
        .eq('id', user.id)

      if (updateError) {
        console.log('   ❌ Error updating profile:', updateError.message)
        return
      }

      console.log('   ✅ Profile updated with default organization')

      // Create default categories
      console.log('\n4. Creating default categories...')
      const categories = [
        { name: 'Salary', type: 'INCOME' },
        { name: 'Freelance', type: 'INCOME' },
        { name: 'Investment', type: 'INCOME' },
        { name: 'Gift', type: 'INCOME' },
        { name: 'Other Income', type: 'INCOME' },
        { name: 'Food', type: 'EXPENSE' },
        { name: 'Transport', type: 'EXPENSE' },
        { name: 'Housing', type: 'EXPENSE' },
        { name: 'Utilities', type: 'EXPENSE' },
        { name: 'Health', type: 'EXPENSE' },
        { name: 'Entertainment', type: 'EXPENSE' },
        { name: 'Shopping', type: 'EXPENSE' },
        { name: 'Other Expense', type: 'EXPENSE' }
      ].map(cat => ({
        ...cat,
        organization_id: newOrg.id,
        is_default: true
      }))

      const { error: catError } = await supabase
        .from('categories')
        .insert(categories)

      if (catError) {
        console.log('   ⚠️  Warning: Error creating categories:', catError.message)
      } else {
        console.log('   ✅ Default categories created')
      }
    } else {
      console.log('   ✅ Organization exists:', refreshedProfile.default_organization_id)
    }

    // 4. Test login
    console.log('\n5. Testing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test123' // Change this if needed
    })

    if (loginError) {
      console.log('   ❌ Login still failed:', loginError.message)
      console.log('\n   Possible issues:')
      console.log('   1. Wrong password')
      console.log('   2. Email not confirmed')
      console.log('   3. Database trigger still has issues')
    } else {
      console.log('   ✅ LOGIN SUCCESS! 🎉')
      console.log('   User can now login to the app!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }

  console.log('\n=== Done ===')
  console.log('Try logging in again at: http://localhost:3000/login')
}

checkAndFixUser()
