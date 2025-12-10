import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSQLFix() {
  console.log('=== Running SQL Fix for Auth Error ===\n')

  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, '..', 'supabase', 'fix-auth-error.sql')
    console.log('Reading SQL file:', sqlFilePath)
    const sqlContent = readFileSync(sqlFilePath, 'utf8')

    console.log('\n📝 SQL file loaded successfully')
    console.log('Lines:', sqlContent.split('\n').length)

    // Split SQL into individual statements (crude but works for our case)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '')

    console.log('Statements to execute:', statements.length)
    console.log('\n🚀 Starting execution...\n')

    // Execute each statement using raw SQL via REST API
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';'

      // Skip comments
      if (stmt.trim().startsWith('--')) continue

      console.log(`[${i + 1}/${statements.length}] Executing...`)

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: stmt })
        })

        if (!response.ok) {
          console.log(`   ⚠️  Statement ${i + 1} failed (this might be expected)`)
          console.log(`   Response: ${response.status} ${response.statusText}`)
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        }
      } catch (error) {
        console.log(`   ⚠️  Error executing statement ${i + 1}:`, error.message)
      }
    }

    console.log('\n⚠️  Note: Supabase doesn\'t allow direct SQL execution via API for DDL statements.')
    console.log('The statements above may have failed, which is expected.')
    console.log('\n=== MANUAL EXECUTION REQUIRED ===\n')
    console.log('Please follow these steps:')
    console.log('1. Open: https://app.supabase.com/project/tpkzeewyrzlepmpalyca/sql')
    console.log('2. Click "New Query"')
    console.log('3. Copy-paste the entire contents of: supabase/fix-auth-error.sql')
    console.log('4. Click "Run" or press Ctrl+Enter')
    console.log('5. Wait for "Success" message')
    console.log('\n💡 The SQL file is ready at: supabase/fix-auth-error.sql')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  console.log('\n=== Opening SQL in Terminal ===\n')

  // Print the SQL for easy copy-paste
  try {
    const sqlFilePath = join(__dirname, '..', 'supabase', 'fix-auth-error.sql')
    const sqlContent = readFileSync(sqlFilePath, 'utf8')

    console.log('📋 Copy the SQL below and paste it in Supabase SQL Editor:\n')
    console.log('─'.repeat(80))
    console.log(sqlContent)
    console.log('─'.repeat(80))
  } catch (error) {
    console.error('Error reading SQL file:', error.message)
  }
}

runSQLFix()
