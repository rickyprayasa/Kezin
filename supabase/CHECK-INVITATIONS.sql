-- Check all invitations
SELECT
    i.id,
    i.email,
    i.token,
    i.status,
    i.created_at,
    i.expires_at,
    CASE
        WHEN i.expires_at < NOW() THEN '❌ EXPIRED'
        WHEN i.status = 'accepted' THEN '✅ ACCEPTED'
        WHEN i.status = 'pending' THEN '⏳ PENDING'
        ELSE '❓ ' || i.status
    END as invite_status,
    o.name as organization_name,
    p.full_name as invited_by_name,
    p.email as invited_by_email
FROM invitations i
LEFT JOIN organizations o ON o.id = i.organization_id
LEFT JOIN profiles p ON p.id = i.invited_by
ORDER BY i.created_at DESC
LIMIT 10;

-- Check if there are any valid pending invitations
SELECT COUNT(*) as pending_count
FROM invitations
WHERE status = 'pending'
AND expires_at > NOW();
