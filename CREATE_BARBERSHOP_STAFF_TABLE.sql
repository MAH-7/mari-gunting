-- Create barbershop_staff table
CREATE TABLE IF NOT EXISTS barbershop_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by barbershop
CREATE INDEX IF NOT EXISTS idx_barbershop_staff_barbershop_id 
  ON barbershop_staff(barbershop_id);

-- Index for filtering active staff
CREATE INDEX IF NOT EXISTS idx_barbershop_staff_is_active 
  ON barbershop_staff(is_active);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_barbershop_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barbershop_staff_updated_at
  BEFORE UPDATE ON barbershop_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_barbershop_staff_updated_at();

-- Enable RLS
ALTER TABLE barbershop_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Barbershop owners can manage their own staff
CREATE POLICY "Barbershop owners can view their staff"
  ON barbershop_staff FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Barbershop owners can insert their staff"
  ON barbershop_staff FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Barbershop owners can update their staff"
  ON barbershop_staff FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Barbershop owners can delete their staff"
  ON barbershop_staff FOR DELETE
  USING (
    barbershop_id IN (
      SELECT id FROM barbershops WHERE owner_id = auth.uid()
    )
  );

-- Customers can view active staff when browsing barbershops
CREATE POLICY "Customers can view active staff"
  ON barbershop_staff FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins have full access to staff"
  ON barbershop_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
