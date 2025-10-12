-- Create admin audit log table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_user TEXT NOT NULL,
  affected_user_id UUID,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON admin_audit_log(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_user);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- Enable RLS (only service role can access)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on audit log"
ON admin_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Audit trail for all admin actions (phone changes, account modifications, etc.)';
COMMENT ON COLUMN admin_audit_log.action IS 'Type of action: PHONE_CHANGE, EMAIL_CHANGE, ACCOUNT_DELETE, etc.';
COMMENT ON COLUMN admin_audit_log.admin_user IS 'Email or ID of admin who performed the action';
COMMENT ON COLUMN admin_audit_log.affected_user_id IS 'UUID of the user affected by this action';
COMMENT ON COLUMN admin_audit_log.old_value IS 'Previous value before change';
COMMENT ON COLUMN admin_audit_log.new_value IS 'New value after change';
COMMENT ON COLUMN admin_audit_log.reason IS 'Reason provided for the change';
COMMENT ON COLUMN admin_audit_log.ip_address IS 'IP address of admin performing action';
COMMENT ON COLUMN admin_audit_log.metadata IS 'Additional context stored as JSON';

-- Create a view for easy querying
CREATE OR REPLACE VIEW admin_audit_log_readable AS
SELECT 
  a.id,
  a.action,
  a.admin_user,
  p.full_name as affected_user_name,
  p.email as affected_user_email,
  a.old_value,
  a.new_value,
  a.reason,
  a.created_at,
  CASE 
    WHEN a.created_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
    WHEN a.created_at > NOW() - INTERVAL '1 day' THEN 'Today'
    WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 'This week'
    ELSE TO_CHAR(a.created_at, 'YYYY-MM-DD')
  END as time_ago
FROM admin_audit_log a
LEFT JOIN profiles p ON a.affected_user_id = p.id
ORDER BY a.created_at DESC;

COMMENT ON VIEW admin_audit_log_readable IS 'Human-readable view of audit log with user details';
