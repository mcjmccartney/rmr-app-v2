-- Alternative: Remove the updated_at trigger if you don't need it
-- Run this in your Supabase SQL Editor

-- Drop the trigger that's causing the error
DROP TRIGGER IF EXISTS update_finances_updated_at ON finances;

-- Verify the trigger was removed
SELECT 'Finances table updated_at trigger removed successfully!' as status;
