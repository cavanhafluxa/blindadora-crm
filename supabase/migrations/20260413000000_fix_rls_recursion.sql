-- Fix for RLS Infinite Recursion & Cleanup
-- 1. Create SECURITY DEFINER function to break recursion
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- 2. Drop old recursive policies
DROP POLICY IF EXISTS "org_isolation_leads" ON leads;
DROP POLICY IF EXISTS "org_isolation_organizations" ON organizations;
DROP POLICY IF EXISTS "org_isolation_profiles" ON profiles;
DROP POLICY IF EXISTS "org_isolation_projects" ON projects;
DROP POLICY IF EXISTS "org_isolation_production_stages" ON production_stages;
DROP POLICY IF EXISTS "org_isolation_stage_photos" ON stage_photos;
DROP POLICY IF EXISTS "org_isolation_materials" ON materials;
DROP POLICY IF EXISTS "org_isolation_project_materials" ON project_materials;
DROP POLICY IF EXISTS "org_isolation_documents" ON documents;
DROP POLICY IF EXISTS "org_isolation_financials" ON financials;
DROP POLICY IF EXISTS "org_isolation_maintenance_orders" ON maintenance_orders;
DROP POLICY IF EXISTS "org_isolation_notifications" ON notifications;
DROP POLICY IF EXISTS "org_isolation_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "org_isolation_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "org_isolation_project_specific_purchases" ON project_specific_purchases;
DROP POLICY IF EXISTS "org_isolation_project_purchases" ON project_purchases;
DROP POLICY IF EXISTS "org_isolation_proposals" ON proposals;
DROP POLICY IF EXISTS "org_isolation_suppliers" ON suppliers;

-- 3. Re-create non-recursive policies
CREATE POLICY "org_isolation_profiles" ON profiles USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_leads" ON leads USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_organizations" ON organizations USING (id = get_my_org_id());
CREATE POLICY "org_isolation_projects" ON projects USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_financials" ON financials USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_maintenance_orders" ON maintenance_orders USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_materials" ON materials USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_notifications" ON notifications USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_audit_logs" ON audit_logs USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_stock_movements" ON stock_movements USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_project_purchases" ON project_purchases USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_proposals" ON proposals USING (organization_id = get_my_org_id());
CREATE POLICY "org_isolation_suppliers" ON suppliers USING (organization_id = get_my_org_id());

CREATE POLICY "org_isolation_production_stages" ON production_stages USING (
  project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id())
);
CREATE POLICY "org_isolation_stage_photos" ON stage_photos USING (
  stage_id IN (SELECT id FROM production_stages WHERE project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id()))
);
CREATE POLICY "org_isolation_project_materials" ON project_materials USING (
  project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id())
);
CREATE POLICY "org_isolation_documents" ON documents USING (
  project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id())
);
CREATE POLICY "org_isolation_project_specific_purchases" ON project_specific_purchases USING (
  project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id())
);
