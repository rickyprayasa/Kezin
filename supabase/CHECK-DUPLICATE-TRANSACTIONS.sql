-- =====================================================
-- Check for Duplicate Transactions
-- =====================================================

-- Find potential duplicates (same description, amount, date within 1 minute)
SELECT 
    description,
    amount,
    date,
    type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    MAX(created_at) - MIN(created_at) as time_diff
FROM transactions
GROUP BY description, amount, date, type
HAVING COUNT(*) > 1
ORDER BY last_created DESC;

-- Show recent transactions with timestamps
SELECT 
    id,
    description,
    amount,
    type,
    date,
    created_at,
    asset_id
FROM transactions
ORDER BY created_at DESC
LIMIT 20;

-- Delete duplicate transactions (keep the first one)
-- UNCOMMENT TO RUN:
-- DELETE FROM transactions 
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (
--             PARTITION BY description, amount, date, type, asset_id 
--             ORDER BY created_at ASC
--         ) as rn
--         FROM transactions
--     ) t
--     WHERE rn > 1
-- );
