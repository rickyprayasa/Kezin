-- =====================================================
-- INVITATION SYSTEM - Team Member Invitations
-- =====================================================
-- This creates a system for inviting team members
-- Invited users will NOT get their own organization
-- =====================================================

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id),
    role team_role DEFAULT 'member',
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(email, organization_id)
);

-- Add index for faster lookups
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org ON invitations(organization_id);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations to their orgs" ON invitations
    FOR SELECT USING (
        is_org_admin(organization_id) OR
        auth.uid() IN (SELECT id FROM auth.users WHERE email = invitations.email)
    );

CREATE POLICY "Admins can create invitations" ON invitations
    FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Admins can update invitations" ON invitations
    FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY "Admins can delete invitations" ON invitations
    FOR DELETE USING (is_org_admin(organization_id));

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to check if user was invited
CREATE OR REPLACE FUNCTION is_invited_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM invitations
        WHERE email = user_email
        AND status = 'pending'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending invitation for user
CREATE OR REPLACE FUNCTION get_pending_invitation(user_email TEXT)
RETURNS TABLE (
    invitation_id UUID,
    organization_id UUID,
    role team_role,
    token TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, invitations.organization_id, invitations.role, invitations.token
    FROM invitations
    WHERE email = user_email
    AND status = 'pending'
    AND expires_at > NOW()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT 'Invitation system created successfully!' as status;
