import pg from 'pg'
const { Client } = pg

// Direct connection (not pooler) - get from Supabase Dashboard > Settings > Database
// Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Tun33c4%232024@db.tpkzeewyrzlepmpalyca.supabase.co:5432/postgres'

const migrationSQL = `
-- Fix RLS Policies for User Signup Flow

-- 1. Allow INSERT on profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Allow INSERT on organizations
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (true);

-- 3. Allow INSERT on organization_members
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
CREATE POLICY "Users can join organizations" ON organization_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Allow INSERT on categories  
DROP POLICY IF EXISTS "Members can create categories" ON categories;
CREATE POLICY "Members can create categories" ON categories
    FOR INSERT WITH CHECK (true);

-- 5. Recreate handle_new_user() function with proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO public.organizations (name, slug, plan, max_members, max_savings_goals)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
        NEW.id::text,
        'free',
        1,
        1
    )
    RETURNING id INTO new_org_id;
    
    INSERT INTO public.organization_members (organization_id, user_id, role, accepted_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());
    
    UPDATE public.profiles SET default_organization_id = new_org_id WHERE id = NEW.id;
    
    INSERT INTO public.categories (organization_id, name, type, is_default) VALUES
    (new_org_id, 'Salary', 'INCOME', TRUE),
    (new_org_id, 'Freelance', 'INCOME', TRUE),
    (new_org_id, 'Investment', 'INCOME', TRUE),
    (new_org_id, 'Gift', 'INCOME', TRUE),
    (new_org_id, 'Other Income', 'INCOME', TRUE),
    (new_org_id, 'Food', 'EXPENSE', TRUE),
    (new_org_id, 'Transport', 'EXPENSE', TRUE),
    (new_org_id, 'Housing', 'EXPENSE', TRUE),
    (new_org_id, 'Utilities', 'EXPENSE', TRUE),
    (new_org_id, 'Health', 'EXPENSE', TRUE),
    (new_org_id, 'Entertainment', 'EXPENSE', TRUE),
    (new_org_id, 'Shopping', 'EXPENSE', TRUE),
    (new_org_id, 'Other Expense', 'EXPENSE', TRUE);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
`

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Connecting to Supabase database...')
    await client.connect()
    console.log('Connected!')

    console.log('Running migration...')
    await client.query(migrationSQL)
    console.log('Migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
