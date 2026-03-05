-- Create access_codes table for one-time password system
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  CONSTRAINT check_expires_at CHECK (expires_at > created_at)
);

-- Create index for faster lookups
CREATE INDEX idx_access_codes_code ON access_codes(code) WHERE NOT used;
CREATE INDEX idx_access_codes_expires_at ON access_codes(expires_at) WHERE NOT used;

-- Add RLS policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read non-expired, unused codes (for verification)
CREATE POLICY "Allow public to read valid codes" ON access_codes
  FOR SELECT
  USING (NOT used AND expires_at > NOW());

-- Policy: Service role can insert codes
CREATE POLICY "Allow service role to insert codes" ON access_codes
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update codes
CREATE POLICY "Allow service role to update codes" ON access_codes
  FOR UPDATE
  USING (true);

-- Add comment
COMMENT ON TABLE access_codes IS 'Stores one-time access codes for student login (valid for 1 hour)';
