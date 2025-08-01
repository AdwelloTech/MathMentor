-- Check the actual table structure of id_verifications
-- This will show us the correct column names

-- 1. Show all columns in the table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show the table structure in a more readable format
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'YES' THEN 'NULL'
    ELSE 'NOT NULL'
  END as nullable,
  COALESCE(column_default, '') as default_value
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'; 