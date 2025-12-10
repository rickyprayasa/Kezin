// Migration script untuk Supabase
// Jalankan dengan: npx tsx supabase/migrate.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting Supabase Migration...\n')
  
  // Test connection
  const { data, error } = await supabase.from('_test_connection').select('*').limit(1)
  if (error && !error.message.includes('does not exist')) {
    console.log('✅ Connected to Supabase successfully!\n')
  }

  console.log('📋 Migration Instructions:')
  console.log('=' .repeat(50))
  console.log('')
  console.log('Karena Supabase tidak mengizinkan eksekusi DDL via REST API,')
  console.log('Anda perlu menjalankan schema SQL secara manual:')
  console.log('')
  console.log('1. Buka Supabase Dashboard:')
  console.log(`   ${supabaseUrl.replace('.supabase.co', '')}/project/_/sql`)
  console.log('')
  console.log('2. Buka file: supabase/schema.sql')
  console.log('')
  console.log('3. Copy dan paste seluruh isi file ke SQL Editor')
  console.log('')
  console.log('4. Klik "Run" untuk mengeksekusi')
  console.log('')
  console.log('=' .repeat(50))
  console.log('')
  console.log('Atau gunakan Supabase CLI:')
  console.log('  npx supabase db push')
  console.log('')
}

runMigration().catch(console.error)
