-- Remove SMS notification columns (WhatsApp + Call only).
-- channel_type enum keeps SMS for historical contact_events rows.

ALTER TABLE tags DROP COLUMN IF EXISTS notify_sms;
ALTER TABLE user_settings DROP COLUMN IF EXISTS notify_sms;
