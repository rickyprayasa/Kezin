-- =====================================================
-- SAVERY - Multi-Tenant Finance Management SaaS
-- Supabase Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'team');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE asset_type AS ENUM ('CASH', 'INVESTMENT', 'PROPERTY', 'DEBT');
CREATE TYPE kanban_status AS ENUM ('TODO', 'PLANNED', 'PAID', 'OVERDUE');
CREATE TYPE debt_type AS ENUM ('OWE', 'OWED');
CREATE TYPE budget_period AS ENUM ('MONTHLY', 'WEEKLY');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- =====================================================
-- ORGANIZATIONS (Tenants)
-- =====================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    
    -- Subscription
    plan subscription_plan DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_ends_at TIMESTAMPTZ,
    
    -- Limits based on plan
    max_members INT DEFAULT 1, -- Free: 1, Pro: 1, Team: 5
    max_savings_goals INT DEFAULT 1, -- Free: 1, Pro: unlimited, Team: unlimited
    ai_requests_remaining INT DEFAULT 0, -- Free: 0, Pro/Team: unlimited (-1)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    theme_color VARCHAR(50) DEFAULT 'bg-brand-orange',
    language VARCHAR(2) DEFAULT 'ID',
    
    -- Default settings
    default_organization_id UUID REFERENCES organizations(id),
    default_asset_id UUID, -- Will reference assets table
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION MEMBERS (Multi-tenant membership)
-- =====================================================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role team_role DEFAULT 'member',
    
    -- Invitation
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- ASSETS / ACCOUNTS
-- =====================================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type asset_type NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IDR',
    icon VARCHAR(50),
    color VARCHAR(50),
    
    -- For tracking trends
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for default_asset_id in profiles
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_default_asset 
FOREIGN KEY (default_asset_id) REFERENCES assets(id) ON DELETE SET NULL;

-- =====================================================
-- CATEGORIES
-- =====================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    type transaction_type NOT NULL, -- INCOME or EXPENSE
    icon VARCHAR(50),
    color VARCHAR(50),
    
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, name, type)
);

-- =====================================================
-- TRANSACTIONS
-- =====================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    amount DECIMAL(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- References
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    transfer_to_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- For transfers
    
    -- User tracking
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Metadata
    notes TEXT,
    tags TEXT[], -- Array of tags
    attachments TEXT[], -- Array of file URLs
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTION HISTORY (Audit Log)
-- =====================================================

CREATE TABLE transaction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    
    action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    changed_by UUID NOT NULL REFERENCES profiles(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Store previous values as JSON
    previous_values JSONB,
    new_values JSONB
);

-- =====================================================
-- SAVINGS GOALS
-- =====================================================

CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    deadline DATE,
    icon VARCHAR(50) DEFAULT '💰',
    
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SAVINGS CONTRIBUTIONS
-- =====================================================

CREATE TABLE savings_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    savings_goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    
    amount DECIMAL(15, 2) NOT NULL,
    source_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DEBTS
-- =====================================================

CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type debt_type NOT NULL, -- OWE (I owe) or OWED (Someone owes me)
    lender_name VARCHAR(255) NOT NULL, -- Person/entity name
    
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    due_date DATE,
    
    notes TEXT,
    
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DEBT PAYMENTS
-- =====================================================

CREATE TABLE debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    
    amount DECIMAL(15, 2) NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BUDGETS
-- =====================================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    category_name VARCHAR(100), -- Fallback if category deleted
    
    amount_limit DECIMAL(15, 2) NOT NULL,
    period budget_period DEFAULT 'MONTHLY',
    
    -- For tracking specific periods
    start_date DATE,
    end_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BILL TASKS (Kanban)
-- =====================================================

CREATE TABLE bill_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status kanban_status DEFAULT 'TODO',
    
    -- Optional references
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- 'monthly', 'weekly', etc.
    
    paid_at TIMESTAMPTZ,
    paid_from_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI CHAT HISTORY
-- =====================================================

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    
    -- If AI created a transaction
    created_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    tokens_used INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is org owner/admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Members can view their organizations
CREATE POLICY "Members can view organizations" ON organizations
    FOR SELECT USING (is_org_member(id));

CREATE POLICY "Admins can update organizations" ON organizations
    FOR UPDATE USING (is_org_admin(id));

-- Organization Members
CREATE POLICY "Members can view org members" ON organization_members
    FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "Admins can manage members" ON organization_members
    FOR ALL USING (is_org_admin(organization_id));

-- Assets
CREATE POLICY "Members can view assets" ON assets
    FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "Members can create assets" ON assets
    FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update assets" ON assets
    FOR UPDATE USING (is_org_member(organization_id));

CREATE POLICY "Admins can delete assets" ON assets
    FOR DELETE USING (is_org_admin(organization_id));

-- Categories
CREATE POLICY "Members can view categories" ON categories
    FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "Members can manage categories" ON categories
    FOR ALL USING (is_org_member(organization_id));

-- Transactions
CREATE POLICY "Members can view transactions" ON transactions
    FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "Members can create transactions" ON transactions
    FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Members can update own transactions" ON transactions
    FOR UPDATE USING (is_org_member(organization_id) AND created_by = auth.uid());

CREATE POLICY "Admins can delete transactions" ON transactions
    FOR DELETE USING (is_org_admin(organization_id));

-- Similar policies for other tables...
CREATE POLICY "Members can manage savings_goals" ON savings_goals
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members can manage savings_contributions" ON savings_contributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM savings_goals sg 
            WHERE sg.id = savings_goal_id 
            AND is_org_member(sg.organization_id)
        )
    );

CREATE POLICY "Members can manage debts" ON debts
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members can manage debt_payments" ON debt_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM debts d 
            WHERE d.id = debt_id 
            AND is_org_member(d.organization_id)
        )
    );

CREATE POLICY "Members can manage budgets" ON budgets
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members can manage bill_tasks" ON bill_tasks
    FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Users can view own AI conversations" ON ai_conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create AI conversations" ON ai_conversations
    FOR INSERT WITH CHECK (user_id = auth.uid() AND is_org_member(organization_id));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_assets_org ON assets(organization_id);
CREATE INDEX idx_transactions_org ON transactions(organization_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_savings_goals_org ON savings_goals(organization_id);
CREATE INDEX idx_debts_org ON debts(organization_id);
CREATE INDEX idx_budgets_org ON budgets(organization_id);
CREATE INDEX idx_bill_tasks_org ON bill_tasks(organization_id);
CREATE INDEX idx_bill_tasks_status ON bill_tasks(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bill_tasks_updated_at
    BEFORE UPDATE ON bill_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Create profile on user signup
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
    
    -- Create personal organization
    INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
        NEW.id::text,
        'free',
        1,
        1
    )
    RETURNING id INTO new_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());
    
    -- Set default organization
    UPDATE profiles SET default_organization_id = new_org_id WHERE id = NEW.id;
    
    -- Create default categories
    INSERT INTO categories (organization_id, name, type, is_default) VALUES
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update asset balance on transaction
CREATE OR REPLACE FUNCTION update_asset_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'EXPENSE' AND NEW.asset_id IS NOT NULL THEN
            UPDATE assets SET balance = balance - NEW.amount WHERE id = NEW.asset_id;
        ELSIF NEW.type = 'INCOME' AND NEW.asset_id IS NOT NULL THEN
            UPDATE assets SET balance = balance + NEW.amount WHERE id = NEW.asset_id;
        ELSIF NEW.type = 'TRANSFER' THEN
            IF NEW.asset_id IS NOT NULL THEN
                UPDATE assets SET balance = balance - NEW.amount WHERE id = NEW.asset_id;
            END IF;
            IF NEW.transfer_to_asset_id IS NOT NULL THEN
                UPDATE assets SET balance = balance + NEW.amount WHERE id = NEW.transfer_to_asset_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Revert balance on delete
        IF OLD.type = 'EXPENSE' AND OLD.asset_id IS NOT NULL THEN
            UPDATE assets SET balance = balance + OLD.amount WHERE id = OLD.asset_id;
        ELSIF OLD.type = 'INCOME' AND OLD.asset_id IS NOT NULL THEN
            UPDATE assets SET balance = balance - OLD.amount WHERE id = OLD.asset_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_change
    AFTER INSERT OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_asset_balance();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- You can run this separately for testing:
-- INSERT INTO ... 
