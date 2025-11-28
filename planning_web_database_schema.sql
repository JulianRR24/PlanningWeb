-- ============================================================================
-- planning_web Database Schema Migration Script
-- ============================================================================
-- Project: planning_web
-- Description: Creates the new database schema with standardized naming
--              convention using planning_web_ prefix and snake_case
-- ============================================================================

-- Drop existing objects if they exist (for clean migration)
-- Note: Using CASCADE to drop dependent objects automatically
DROP TABLE IF EXISTS planning_web_key_value_store CASCADE;

-- ============================================================================
-- TABLE: planning_web_key_value_store
-- ============================================================================
-- Description: Main key-value store for application data
-- Replaces: kv table from old schema
-- ============================================================================

CREATE TABLE planning_web_key_value_store (
  planning_web_kv_id BIGSERIAL PRIMARY KEY,
  planning_web_kv_key TEXT UNIQUE NOT NULL,
  planning_web_kv_value JSONB NOT NULL,
  planning_web_kv_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  planning_web_kv_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment for documentation
COMMENT ON TABLE planning_web_key_value_store IS 'Key-value store for planning_web application data including routines, widgets, and settings';
COMMENT ON COLUMN planning_web_key_value_store.planning_web_kv_id IS 'Primary key, auto-incrementing ID';
COMMENT ON COLUMN planning_web_key_value_store.planning_web_kv_key IS 'Unique key identifier (e.g., planningweb:routines)';
COMMENT ON COLUMN planning_web_key_value_store.planning_web_kv_value IS 'JSON value stored for the key';
COMMENT ON COLUMN planning_web_key_value_store.planning_web_kv_created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN planning_web_key_value_store.planning_web_kv_updated_at IS 'Timestamp when record was last updated';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for faster key lookups (most common query pattern)
CREATE INDEX planning_web_kv_key_idx ON planning_web_key_value_store(planning_web_kv_key);

-- GIN index for JSONB queries (enables efficient JSON field searches)
CREATE INDEX planning_web_kv_value_idx ON planning_web_key_value_store USING GIN(planning_web_kv_value);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE planning_web_key_value_store ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
-- NOTE: Adjust this policy based on your authentication requirements
-- Current policy allows all operations for all users (suitable for public app)
CREATE POLICY planning_web_kv_policy_all 
  ON planning_web_key_value_store 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION planning_web_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.planning_web_kv_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION planning_web_update_updated_at_column() IS 'Automatically updates the planning_web_kv_updated_at column on row updates';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at on every UPDATE
CREATE TRIGGER planning_web_kv_update_timestamp
  BEFORE UPDATE ON planning_web_key_value_store
  FOR EACH ROW
  EXECUTE FUNCTION planning_web_update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ============================================================================

-- Uncomment the following lines to insert sample/default data
-- INSERT INTO planning_web_key_value_store (planning_web_kv_key, planning_web_kv_value) 
-- VALUES 
--   ('planningweb:routines', '[]'::jsonb),
--   ('planningweb:widgets', '[]'::jsonb),
--   ('planningweb:activeRoutineId', '""'::jsonb),
--   ('planningweb:notifyBeforeStart', '10'::jsonb),
--   ('planningweb:notifyBeforeEnd', '5'::jsonb);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'planning_web_key_value_store';

-- Verify columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'planning_web_key_value_store'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'planning_web_key_value_store';

-- Verify RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'planning_web_key_value_store';

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
