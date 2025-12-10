// SAVERY - Database Migration Script
// Run: node supabase/run-migration.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://tpkzeewyrzlepmpalyca.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw';

async function runSQL(sql, description) {
  console.log(`\n📌 ${description}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      // Try alternative method - direct PostgreSQL protocol isn't available via REST
      // So we need to use Supabase Dashboard or CLI
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log(`   ✅ Success`);
    return result;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 SAVERY Database Migration');
  console.log('=' .repeat(50));
  console.log('');
  console.log('⚠️  Supabase REST API tidak mendukung DDL (CREATE TABLE, dll)');
  console.log('');
  console.log('📋 Untuk menjalankan migrasi, gunakan salah satu cara:');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔹 CARA 1: Supabase Dashboard SQL Editor (Recommended)');
  console.log('');
  console.log('   1. Buka link ini:');
  console.log('      https://supabase.com/dashboard/project/tpkzeewyrzlepmpalyca/sql/new');
  console.log('');
  console.log('   2. Copy isi file: supabase/schema.sql');
  console.log('');
  console.log('   3. Paste ke SQL Editor');
  console.log('');
  console.log('   4. Klik tombol "Run" (atau Cmd/Ctrl + Enter)');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔹 CARA 2: Supabase CLI');
  console.log('');
  console.log('   npx supabase login');
  console.log('   npx supabase link --project-ref tpkzeewyrzlepmpalyca');
  console.log('   npx supabase db push');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Show schema summary
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const tables = schema.match(/CREATE TABLE (\w+)/g) || [];
  const functions = schema.match(/CREATE OR REPLACE FUNCTION (\w+)/g) || [];
  const triggers = schema.match(/CREATE TRIGGER (\w+)/g) || [];
  const policies = schema.match(/CREATE POLICY "([^"]+)"/g) || [];
  
  console.log('📊 Schema Summary:');
  console.log(`   • ${tables.length} Tables`);
  console.log(`   • ${functions.length} Functions`);
  console.log(`   • ${triggers.length} Triggers`);
  console.log(`   • ${policies.length} RLS Policies`);
  console.log('');
  console.log('📁 Tables to create:');
  tables.forEach(t => {
    const name = t.replace('CREATE TABLE ', '');
    console.log(`   - ${name}`);
  });
  console.log('');
}

main().catch(console.error);
