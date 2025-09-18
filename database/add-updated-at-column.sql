-- Add updated_at column to users table
-- This fixes the signup error where the database function expects this column

-- Add the missing updated_at column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the users table
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Update existing records to have the current timestamp
UPDATE public.users
SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;