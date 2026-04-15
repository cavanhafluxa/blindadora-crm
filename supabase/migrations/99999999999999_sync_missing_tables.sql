-- SQL Synchronization Script for Missing Tables
-- Purpose: Ensure the database has all tables required by the application code.

-- 1. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  movement_type TEXT CHECK (movement_type IN ('in', 'out')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project Purchases
CREATE TABLE IF NOT EXISTS project_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  total_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add Policies using get_my_org_id() pattern (assumes migration 20260413000000 has been run)
-- Note: These policies follow the non-recursive pattern implemented in fix_rls_recursion.sql

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_org_id') THEN
        EXECUTE 'CREATE POLICY org_isolation_notifications ON notifications USING (organization_id = get_my_org_id())';
        EXECUTE 'CREATE POLICY org_isolation_stock_movements ON stock_movements USING (organization_id = get_my_org_id())';
        EXECUTE 'CREATE POLICY org_isolation_project_purchases ON project_purchases USING (organization_id = get_my_org_id())';
        EXECUTE 'CREATE POLICY org_isolation_audit_logs ON audit_logs USING (organization_id = get_my_org_id())';
        EXECUTE 'CREATE POLICY org_isolation_suppliers ON suppliers USING (organization_id = get_my_org_id())';
        EXECUTE 'CREATE POLICY org_isolation_proposals ON proposals USING (organization_id = get_my_org_id())';
    END IF;
END $$;
