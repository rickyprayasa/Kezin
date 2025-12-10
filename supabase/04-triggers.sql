-- =====================================================
-- SAVERY - Part 4: Indexes, Triggers & Functions
-- =====================================================

-- Indexes
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

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bill_tasks_updated_at BEFORE UPDATE ON bill_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO organizations (name, slug, plan, max_members, max_savings_goals)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
        NEW.id::text,
        'free',
        1,
        1
    )
    RETURNING id INTO new_org_id;
    
    INSERT INTO organization_members (organization_id, user_id, role, accepted_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());
    
    UPDATE profiles SET default_organization_id = new_org_id WHERE id = NEW.id;
    
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
