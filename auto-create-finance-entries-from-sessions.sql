-- Auto-create finance entries for months with sessions but no existing finance entry
-- This script will create finance entries for any month/year combination that has sessions
-- but doesn't already have a finance entry

-- First, let's see what months have sessions but no finance entries
WITH session_months AS (
  SELECT DISTINCT
    CASE EXTRACT(MONTH FROM booking_date)
      WHEN 1 THEN 'January'
      WHEN 2 THEN 'February'
      WHEN 3 THEN 'March'
      WHEN 4 THEN 'April'
      WHEN 5 THEN 'May'
      WHEN 6 THEN 'June'
      WHEN 7 THEN 'July'
      WHEN 8 THEN 'August'
      WHEN 9 THEN 'September'
      WHEN 10 THEN 'October'
      WHEN 11 THEN 'November'
      WHEN 12 THEN 'December'
    END as month,
    EXTRACT(YEAR FROM booking_date)::INTEGER as year,
    COUNT(*) as session_count,
    SUM(quote) as total_session_value
  FROM sessions
  WHERE booking_date IS NOT NULL
  GROUP BY 
    EXTRACT(MONTH FROM booking_date),
    EXTRACT(YEAR FROM booking_date)
  ORDER BY year DESC, EXTRACT(MONTH FROM booking_date) DESC
),
existing_finances AS (
  SELECT DISTINCT month, year
  FROM finances
),
missing_months AS (
  SELECT sm.*
  FROM session_months sm
  LEFT JOIN existing_finances ef ON sm.month = ef.month AND sm.year = ef.year
  WHERE ef.month IS NULL
)
SELECT 
  month,
  year,
  session_count,
  total_session_value,
  'Missing finance entry' as status
FROM missing_months;

-- Insert finance entries for missing months
-- This will create entries with expected_amount = 0 (you can update these manually later)
INSERT INTO finances (month, year, expected_amount, actual_amount)
SELECT DISTINCT
  CASE EXTRACT(MONTH FROM booking_date)
    WHEN 1 THEN 'January'
    WHEN 2 THEN 'February'
    WHEN 3 THEN 'March'
    WHEN 4 THEN 'April'
    WHEN 5 THEN 'May'
    WHEN 6 THEN 'June'
    WHEN 7 THEN 'July'
    WHEN 8 THEN 'August'
    WHEN 9 THEN 'September'
    WHEN 10 THEN 'October'
    WHEN 11 THEN 'November'
    WHEN 12 THEN 'December'
  END as month,
  EXTRACT(YEAR FROM booking_date)::INTEGER as year,
  0.00 as expected_amount, -- Default to 0, update manually as needed
  0.00 as actual_amount    -- Will be calculated dynamically in the app
FROM sessions s
WHERE booking_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM finances f 
    WHERE f.month = CASE EXTRACT(MONTH FROM s.booking_date)
      WHEN 1 THEN 'January'
      WHEN 2 THEN 'February'
      WHEN 3 THEN 'March'
      WHEN 4 THEN 'April'
      WHEN 5 THEN 'May'
      WHEN 6 THEN 'June'
      WHEN 7 THEN 'July'
      WHEN 8 THEN 'August'
      WHEN 9 THEN 'September'
      WHEN 10 THEN 'October'
      WHEN 11 THEN 'November'
      WHEN 12 THEN 'December'
    END
    AND f.year = EXTRACT(YEAR FROM s.booking_date)::INTEGER
  );

-- Verify the new entries were created
SELECT 
  f.month,
  f.year,
  f.expected_amount,
  COUNT(s.id) as session_count,
  COALESCE(SUM(s.quote), 0) as total_session_value,
  'Newly created' as status
FROM finances f
LEFT JOIN sessions s ON 
  EXTRACT(MONTH FROM s.booking_date) = CASE f.month
    WHEN 'January' THEN 1
    WHEN 'February' THEN 2
    WHEN 'March' THEN 3
    WHEN 'April' THEN 4
    WHEN 'May' THEN 5
    WHEN 'June' THEN 6
    WHEN 'July' THEN 7
    WHEN 'August' THEN 8
    WHEN 'September' THEN 9
    WHEN 'October' THEN 10
    WHEN 'November' THEN 11
    WHEN 'December' THEN 12
  END
  AND EXTRACT(YEAR FROM s.booking_date) = f.year
WHERE f.expected_amount = 0 -- Only show the newly created entries
GROUP BY f.month, f.year, f.expected_amount
ORDER BY f.year DESC, 
  CASE f.month
    WHEN 'January' THEN 1
    WHEN 'February' THEN 2
    WHEN 'March' THEN 3
    WHEN 'April' THEN 4
    WHEN 'May' THEN 5
    WHEN 'June' THEN 6
    WHEN 'July' THEN 7
    WHEN 'August' THEN 8
    WHEN 'September' THEN 9
    WHEN 'October' THEN 10
    WHEN 'November' THEN 11
    WHEN 'December' THEN 12
  END DESC;
