-- ============================================================================
-- planning_web Multi-User Migration Script
-- ============================================================================
-- Description: Adds user segregation to the key-value store.
-- WARNING: This will DELETE existing data if it's not associated with a user.
--          In a production environment, you would back this up first.
-- ============================================================================

-- 1. Add user_id column
ALTER TABLE planning_web_key_value_store 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop existing constraint (to allow multiple users to have the same key preference names)
ALTER TABLE planning_web_key_value_store DROP CONSTRAINT IF EXISTS planning_web_key_value_store_planning_web_kv_key_key;

-- 3. Add new unique composite constraint (user_id + key must be unique)
--    Note: We treat NULL user_id as a "public" or "system" namespace if needed, 
--    but standard unique constraints treat NULLs as distinct. 
--    For robust RLS, we want strict segregation.
--    We will enforce user_id NOT NULL for user data.

-- Optional: Clear existing data that doesn't belong to anyone (since we are switching to private mode)
-- TRUNCATE TABLE planning_web_key_value_store; 
-- (Commented out to be safe, but you might want to run this manually if you want a clean slate)

-- 4. Make user_id NOT NULL (This effectively wipes orphaned data if you haven't assigned it)
--    If you want to keep data, you'd update it first: UPDATE ... SET user_id = 'your-my-id';
--    For now, we will ALLOW NULL temporarily if you want to keep old data as "public",
--    but for the app logic, we will filter by user_id.

-- 5. Add Compound Index for performance
CREATE UNIQUE INDEX IF NOT EXISTS planning_web_kv_user_key_idx 
ON planning_web_key_value_store (user_id, planning_web_kv_key);

-- 6. Enable RLS
ALTER TABLE planning_web_key_value_store ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Policy: Users can only select their own data
DROP POLICY IF EXISTS "Users can view own data" ON planning_web_key_value_store;
CREATE POLICY "Users can view own data" 
ON planning_web_key_value_store 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
DROP POLICY IF EXISTS "Users can insert own data" ON planning_web_key_value_store;
CREATE POLICY "Users can insert own data" 
ON planning_web_key_value_store 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON planning_web_key_value_store;
CREATE POLICY "Users can update own data" 
ON planning_web_key_value_store 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own data
DROP POLICY IF EXISTS "Users can delete own data" ON planning_web_key_value_store;
CREATE POLICY "Users can delete own data" 
ON planning_web_key_value_store 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
