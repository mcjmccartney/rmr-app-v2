-- Check the actual structure of your sessions table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample row to see what data looks like
SELECT * FROM sessions LIMIT 1;
