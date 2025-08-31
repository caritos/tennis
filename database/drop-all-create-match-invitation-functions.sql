-- Query to find all existing create_match_invitation functions
-- Run this first to see what functions exist:
-- SELECT proname, pg_get_function_identity_arguments(oid) 
-- FROM pg_proc 
-- WHERE proname = 'create_match_invitation';

-- Drop ALL versions of create_match_invitation function
-- This uses CASCADE to handle any dependencies
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions with this name and drop them
    FOR func_record IN 
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc 
        WHERE proname = 'create_match_invitation'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_signature;
    END LOOP;
END $$;

-- Verify all functions are dropped
SELECT COUNT(*) as remaining_functions 
FROM pg_proc 
WHERE proname = 'create_match_invitation';