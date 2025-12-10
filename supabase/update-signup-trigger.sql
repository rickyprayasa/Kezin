-- =====================================================
-- Update handle_new_user trigger to create default assets
-- =====================================================
-- This ensures new users get a complete workspace setup
-- with both categories AND default assets (cash/bank accounts)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create profile
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create default organization (auto workspace)
    INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals, ai_requests_remaining)
    VALUES (
        'My Workspace',  -- Default name for new users
        NEW.id::text,
        'free',
        5,  -- Allow 5 members by default
        3,  -- Allow 3 savings goals
        50  -- 50 AI requests
    )
    RETURNING id INTO new_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());
    
    -- Set as default organization
    UPDATE profiles SET default_organization_id = new_org_id WHERE id = NEW.id;
    
    -- Create default categories
    INSERT INTO categories (organization_id, name, type, is_default) VALUES
    (new_org_id, 'Gaji', 'INCOME', TRUE),
    (new_org_id, 'Freelance', 'INCOME', TRUE),
    (new_org_id, 'Investasi', 'INCOME', TRUE),
    (new_org_id, 'Bonus', 'INCOME', TRUE),
    (new_org_id, 'Lainnya', 'INCOME', TRUE),
    (new_org_id, 'Makanan & Minuman', 'EXPENSE', TRUE),
    (new_org_id, 'Transportasi', 'EXPENSE', TRUE),
    (new_org_id, 'Belanja', 'EXPENSE', TRUE),
    (new_org_id, 'Tagihan', 'EXPENSE', TRUE),
    (new_org_id, 'Kesehatan', 'EXPENSE', TRUE),
    (new_org_id, 'Hiburan', 'EXPENSE', TRUE),
    (new_org_id, 'Lain-lain', 'EXPENSE', TRUE);
    
    -- Create default assets (NEW!)
    INSERT INTO assets (organization_id, name, type, balance, icon, color, created_by) VALUES
    (new_org_id, 'Kas', 'CASH', 0, '💵', 'bg-green-500', NEW.id),
    (new_org_id, 'Bank', 'CASH', 0, '🏦', 'bg-blue-500', NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
