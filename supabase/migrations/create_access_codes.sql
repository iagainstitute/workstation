-- Create access_codes table for one-time password system
CREATE TABLE IF NOT EXISTS access_codes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT check_expires_at CHECK (expires_at > created_at),
  CONSTRAINT check_code_length CHECK (LENGTH(code) = 6)
);

-- Insert the single row that will always exist
INSERT INTO access_codes (id, code, created_at, expires_at, used)
VALUES (1, 'INIT00', NOW(), NOW() + INTERVAL '1 hour', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the code (for verification)
CREATE POLICY "Allow public to read codes" ON access_codes
  FOR SELECT
  USING (true);

-- Policy: Service role can update codes
CREATE POLICY "Allow service role to update codes" ON access_codes
  FOR UPDATE
  USING (true);

-- Add comment
COMMENT ON TABLE access_codes IS 'Stores single access code that gets updated (valid for specified duration)';
