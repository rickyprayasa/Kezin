-- =====================================================
-- EMERGENCY FIX - Remove Broken Trigger
-- =====================================================
-- The trigger is causing "Database error saving new user"
-- Remove it completely so signup can work
-- =====================================================

-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verification
SELECT 'Trigger removed - signup should work now!' as status;

-- =====================================================
-- NOTE: You'll need to manually create profile after signup
-- Or we can create a simpler trigger later
-- =====================================================
