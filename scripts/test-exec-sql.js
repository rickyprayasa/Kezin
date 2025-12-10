
const fetch = require('node-fetch'); // Assuming node-fetch is available or using global fetch in Node 18+

const SUPABASE_URL = 'https://tpkzeewyrzlepmpalyca.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyOTk0MSwiZXhwIjoyMDc5ODA1OTQxfQ.A_gf-XV1Vmh0FY3CuYnnbJoMfF1x0GSM3RDZF2NS7Cw';

async function testExecSql() {
    console.log('Testing exec_sql RPC...');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sql_query: 'SELECT version();' })
        });

        if (!response.ok) {
            console.log(`Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log('Response:', text);
        } else {
            const data = await response.json();
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testExecSql();
