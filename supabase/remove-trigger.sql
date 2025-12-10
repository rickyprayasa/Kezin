-- =====================================================
-- REMOVE BROKEN TRIGGER - Emergency Fix
-- =====================================================
-- This removes the broken trigger that's causing auth errors
-- After this, auth should work but profiles won't auto-create
-- =====================================================

-- Remove the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verification
SELECT 'Trigger removed successfully!' as status;
