-- =====================================================
-- SAVERY - Part 3: Row Level Security
-- =====================================================

-- Enable RLS
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

-- Helper functions
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

-- Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Members can view organizations" ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY "Admins can update organizations" ON organizations FOR UPDATE USING (is_org_admin(id));

CREATE POLICY "Members can view org members" ON organization_members FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Admins can manage members" ON organization_members FOR ALL USING (is_org_admin(organization_id));

CREATE POLICY "Members can view assets" ON assets FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can create assets" ON assets FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Members can update assets" ON assets FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY "Admins can delete assets" ON assets FOR DELETE USING (is_org_admin(organization_id));

CREATE POLICY "Members can view categories" ON categories FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can manage categories" ON categories FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members can view transactions" ON transactions FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can create transactions" ON transactions FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "Members can update own transactions" ON transactions FOR UPDATE USING (is_org_member(organization_id) AND created_by = auth.uid());
CREATE POLICY "Admins can delete transactions" ON transactions FOR DELETE USING (is_org_admin(organization_id));

CREATE POLICY "Members can manage savings_goals" ON savings_goals FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "Members can manage savings_contributions" ON savings_contributions FOR ALL USING (EXISTS (SELECT 1 FROM savings_goals sg WHERE sg.id = savings_goal_id AND is_org_member(sg.organization_id)));
CREATE POLICY "Members can manage debts" ON debts FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "Members can manage debt_payments" ON debt_payments FOR ALL USING (EXISTS (SELECT 1 FROM debts d WHERE d.id = debt_id AND is_org_member(d.organization_id)));
CREATE POLICY "Members can manage budgets" ON budgets FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "Members can manage bill_tasks" ON bill_tasks FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "Users can view own AI conversations" ON ai_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create AI conversations" ON ai_conversations FOR INSERT WITH CHECK (user_id = auth.uid() AND is_org_member(organization_id));
