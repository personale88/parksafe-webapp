-- ─────────────────────────────────────────────────────────────────────────────
-- Custom auth migration — remove Supabase RLS policies (app enforces ownership)
-- Safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'vehicles', 'tags', 'contact_events', 'otp_attempts', 'user_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
