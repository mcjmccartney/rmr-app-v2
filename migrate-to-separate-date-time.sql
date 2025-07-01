-- Migrate Sessions Table to Separate Date and Time Columns
-- This script will update your existing sessions table structure

-- STEP 1: Add the new columns
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS booking_date_new DATE,
ADD COLUMN IF NOT EXISTS booking_time_new TIME,
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- STEP 2: Populate the new columns from existing booking_date
-- This extracts date and time from the existing timestamp
UPDATE sessions 
SET 
  booking_date_new = booking_date::date,
  booking_time_new = booking_date::time
WHERE booking_date_new IS NULL;

-- STEP 3: Verify the migration looks correct
SELECT 
  id,
  booking_date as old_booking_date,
  booking_date_new as new_date,
  booking_time_new as new_time,
  session_type
FROM sessions 
ORDER BY booking_date DESC
LIMIT 10;

-- STEP 4: Drop the old column and rename the new ones
-- UNCOMMENT THESE LINES AFTER VERIFYING THE DATA LOOKS CORRECT:

-- ALTER TABLE sessions DROP COLUMN booking_date;
-- ALTER TABLE sessions RENAME COLUMN booking_date_new TO booking_date;
-- ALTER TABLE sessions RENAME COLUMN booking_time_new TO booking_time;

-- STEP 5: Add constraints to the new columns
-- ALTER TABLE sessions ALTER COLUMN booking_date SET NOT NULL;
-- ALTER TABLE sessions ALTER COLUMN booking_time SET NOT NULL;

-- STEP 6: Update the index
-- DROP INDEX IF EXISTS idx_sessions_booking_date;
-- CREATE INDEX idx_sessions_booking_date ON sessions(booking_date);
-- CREATE INDEX idx_sessions_booking_time ON sessions(booking_time);

-- STEP 7: Verify final structure
-- SELECT 
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'sessions' 
--   AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- STEP 8: Check sample data with new structure
-- SELECT 
--   id,
--   booking_date,
--   booking_time,
--   session_type,
--   quote
-- FROM sessions 
-- ORDER BY booking_date DESC, booking_time DESC
-- LIMIT 10;
