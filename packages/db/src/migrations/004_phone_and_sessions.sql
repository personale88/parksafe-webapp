-- ─────────────────────────────────────────────────────────────────────────────
-- Phone encryption column + auth_sessions for custom JWT refresh rotation
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_encrypted text;

-- Fresh installs: phone_encrypted required for new registrations.
-- Existing dev DBs without rows can backfill on next registration.

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  family_id uuid NOT NULL,
  expires_at timestamp NOT NULL,
  revoked_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_refresh_hash_idx ON auth_sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS auth_sessions_family_idx ON auth_sessions (family_id);
