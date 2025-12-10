-- =====================================================
-- SAVERY - Create Test Users
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- Disable trigger sementara
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- User 1: Ricky Yusar (Admin/Owner)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ricky.yusar@rsquareidea.my.id',
    crypt('ultimate704554', gen_salt('bf')),
    NOW(),
    '{"full_name": "Ricky Yusar"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
);

-- User 2: Riska Megasari (Member - akan diundang)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'riskamegasarii@rsquareidea.my.id',
    crypt('ultimate704554', gen_salt('bf')),
    NOW(),
    '{"full_name": "Riska Megasari"}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
);

-- Create identities for login
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    '{"sub": "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", "email": "ricky.yusar@rsquareidea.my.id"}'::jsonb,
    'email',
    'ricky.yusar@rsquareidea.my.id',
    NOW(),
    NOW(),
    NOW()
), (
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    '{"sub": "b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e", "email": "riskamegasarii@rsquareidea.my.id"}'::jsonb,
    'email',
    'riskamegasarii@rsquareidea.my.id',
    NOW(),
    NOW(),
    NOW()
);

-- =====================================================
-- Setup Profile & Organization untuk User 1 (Owner)
-- =====================================================

-- Profile User 1
INSERT INTO profiles (id, email, full_name, theme_color, language)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'ricky.yusar@rsquareidea.my.id',
    'Ricky Yusar',
    'bg-brand-orange',
    'ID'
);

-- Profile User 2 (tanpa organization sendiri)
INSERT INTO profiles (id, email, full_name, theme_color, language)
VALUES (
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'riskamegasarii@rsquareidea.my.id',
    'Riska Megasari',
    'bg-brand-blue',
    'ID'
);

-- Organization untuk User 1
INSERT INTO organizations (id, name, slug, plan, subscription_status, max_members, max_savings_goals, ai_requests_remaining)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Ricky''s Workspace',
    'ricky-workspace',
    'team',
    'active',
    5,
    100,
    -1
);

-- User 1 sebagai Owner
INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'owner',
    NOW()
);

-- User 2 sebagai Member (diundang ke org User 1)
INSERT INTO organization_members (organization_id, user_id, role, invited_by, invited_at, accepted_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'member',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    NOW(),
    NOW()
);

-- Set default organization
UPDATE profiles 
SET default_organization_id = '11111111-1111-1111-1111-111111111111'
WHERE id IN (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e'
);

-- =====================================================
-- Default Categories untuk Organization
-- =====================================================

INSERT INTO categories (organization_id, name, type, icon, is_default) VALUES
-- Income
('11111111-1111-1111-1111-111111111111', 'Gaji', 'INCOME', '💰', TRUE),
('11111111-1111-1111-1111-111111111111', 'Freelance', 'INCOME', '💻', TRUE),
('11111111-1111-1111-1111-111111111111', 'Investasi', 'INCOME', '📈', TRUE),
('11111111-1111-1111-1111-111111111111', 'Hadiah', 'INCOME', '🎁', TRUE),
('11111111-1111-1111-1111-111111111111', 'Lainnya', 'INCOME', '💵', TRUE),
-- Expense
('11111111-1111-1111-1111-111111111111', 'Makanan', 'EXPENSE', '🍔', TRUE),
('11111111-1111-1111-1111-111111111111', 'Transportasi', 'EXPENSE', '🚗', TRUE),
('11111111-1111-1111-1111-111111111111', 'Belanja', 'EXPENSE', '🛒', TRUE),
('11111111-1111-1111-1111-111111111111', 'Tagihan', 'EXPENSE', '📄', TRUE),
('11111111-1111-1111-1111-111111111111', 'Hiburan', 'EXPENSE', '🎬', TRUE),
('11111111-1111-1111-1111-111111111111', 'Kesehatan', 'EXPENSE', '💊', TRUE),
('11111111-1111-1111-1111-111111111111', 'Pendidikan', 'EXPENSE', '📚', TRUE),
('11111111-1111-1111-1111-111111111111', 'Lainnya', 'EXPENSE', '📦', TRUE);

-- =====================================================
-- Sample Assets
-- =====================================================

INSERT INTO assets (id, organization_id, name, type, balance, initial_balance, icon, color, created_by) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Dompet', 'CASH', 500000, 500000, '👛', 'bg-green-500', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'BCA', 'CASH', 15000000, 15000000, '🏦', 'bg-blue-500', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'GoPay', 'CASH', 250000, 250000, '📱', 'bg-emerald-500', 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d');

-- Set default asset
UPDATE profiles 
SET default_asset_id = '22222222-2222-2222-2222-222222222222'
WHERE id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';

-- =====================================================
-- Re-enable trigger
-- =====================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Summary
-- =====================================================
-- User 1: ricky.yusar@rsquareidea.my.id
--   - Role: Owner (full access)
--   - Organization: Ricky's Workspace (Team plan)
--   - Has 3 assets, 13 categories
--
-- User 2: riskamegasarii@rsquareidea.my.id
--   - Role: Member (limited access)
--   - No personal organization
--   - Invited to Ricky's Workspace
--   - Can view/create transactions, but cannot delete or manage members
