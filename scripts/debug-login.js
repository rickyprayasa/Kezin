
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpkzeewyrzlepmpalyca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3plZXd5cnpsZXBtcGFseWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjk5NDEsImV4cCI6MjA3OTgwNTk0MX0.ZqzJeNSGveLS5ufei_-RiCgmNTaQ9tXLeVv9ar4omWw';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debugLogin() {
    console.log('Debugging login...');
    const email = 'ricky.yusar@rsquareidea.my.id';
    const password = 'test123'; // Assuming this is the password being used, or we can try a wrong one

    console.log(`Attempting login for ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.log('Login failed!');
        console.log('Error Message:', error.message);
        console.log('Error Status:', error.status);
        console.log('Error Name:', error.name);
        console.log('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Login successful!');
        console.log('User ID:', data.user.id);
    }
}

debugLogin();
