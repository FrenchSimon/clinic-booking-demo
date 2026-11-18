-- Safety net: every table created in the public schema gets row level security
-- turned on at once. A table without policies then denies everything instead of
-- exposing everything. Each table still defines its own policies in table.ts.

-- Helpers that policies call live in "private", which the Supabase Data API does not expose.
CREATE SCHEMA IF NOT EXISTS private;
--> statement-breakpoint
GRANT USAGE ON SCHEMA private TO authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.enable_rls_on_new_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type = 'table'
      AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
  END LOOP;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.enable_rls_on_new_table() FROM PUBLIC;
--> statement-breakpoint
DROP EVENT TRIGGER IF EXISTS enable_rls_on_new_tables;
--> statement-breakpoint
CREATE EVENT TRIGGER enable_rls_on_new_tables
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION private.enable_rls_on_new_table();
