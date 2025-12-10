
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyFix() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!dbUrl) {
        console.error('No DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL found in .env.local');
        // Try to construct it if we have other vars? No, password is usually hidden.
        return;
    }

    console.log('Connecting to database...');
    // Mask the password in logs
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`URL: ${maskedUrl}`);

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        console.log('Connected!');

        const sqlPath = path.join(__dirname, '../supabase/migrations/20241128000000_fix_rls_policies.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying fix...');
        await client.query(sql);
        console.log('Fix applied successfully!');
    } catch (err) {
        console.error('Error applying fix:', err.message);
    } finally {
        await client.end();
    }
}

applyFix();
