-- Database Schema Reset PROBlind CRM

-- 1. Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Leads (Pipeline de Vendas)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  plate TEXT,
  vehicle_model TEXT,
  armor_type TEXT,
  quoted_value DECIMAL,
  pipeline_stage TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Projects (Blindagem Ativa)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  customer_name TEXT NOT NULL,
  plate TEXT,
  vehicle_model TEXT,
  chassis TEXT,
  status TEXT DEFAULT 'producao', -- producao, revisao, concluido
  overall_progress INTEGER DEFAULT 0,
  contract_value DECIMAL,
  expected_delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Production Stages (As 12 Etapas)
CREATE TABLE production_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- 6. Stage Photos
CREATE TABLE stage_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES production_stages(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- 7. Materials (Estoque Geral)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  quantity_in_stock INTEGER DEFAULT 0,
  unit_price DECIMAL,
  minimum_stock INTEGER DEFAULT 5
);

-- 8. Project Materials (Materiais usados no carro)
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id),
  quantity_used INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  doc_type TEXT,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Financials
CREATE TABLE financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL, -- income ou expense
  amount DECIMAL NOT NULL,
  description TEXT,
  due_date DATE,
  paid boolean DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Maintenance (Pós-Venda)
CREATE TABLE maintenance_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  issue_description TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'scheduled',
  cost DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------- TRIGGERS E FUNÇÕES ---------- --
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_stages INTEGER;
  completed_stages INTEGER;
  new_progress INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO total_stages, completed_stages
  FROM production_stages WHERE project_id = NEW.project_id;
  
  IF total_stages > 0 THEN
    new_progress := (completed_stages * 100) / total_stages;
  ELSE
    new_progress := 0;
  END IF;

  UPDATE projects SET overall_progress = new_progress WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_stage_status_change
AFTER UPDATE OF status ON production_stages
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();

CREATE OR REPLACE FUNCTION create_default_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO production_stages (project_id, stage_name, stage_order) VALUES
  (NEW.id, 'Desmontagem', 1),
  (NEW.id, 'Corte de Mantas/Aramid', 2),
  (NEW.id, 'Montagem de Mantas', 3),
  (NEW.id, 'Corte de Vidros', 4),
  (NEW.id, 'Instalação de Vidros', 5),
  (NEW.id, 'Reforço Estrutural (Aço)', 6),
  (NEW.id, 'Remontagem Interior', 7),
  (NEW.id, 'Ajuste de Máquinas de Vidro', 8),
  (NEW.id, 'Acabamento/Tapeçaria', 9),
  (NEW.id, 'Revisão Elétrica', 10),
  (NEW.id, 'Teste de Infiltração', 11),
  (NEW.id, 'Limpeza e Polimento Final', 12);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_created
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION create_default_stages();

-- ------------- STORAGE BUCKETS ----------- --
insert into storage.buckets (id, name, public) values ('stage-photos', 'stage-photos', false) ON CONFLICT DO NOTHING;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) ON CONFLICT DO NOTHING;
insert into storage.buckets (id, name, public) values ('org-assets', 'org-assets', true) ON CONFLICT DO NOTHING;

-- Ativando RLS Master nas novas Tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "org_isolation_leads" ON leads USING (
   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_isolation_organizations" ON organizations USING (
   id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_isolation_profiles" ON profiles USING (
   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_isolation_projects" ON projects USING (
   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_isolation_production_stages" ON production_stages USING (
   project_id IN (SELECT id FROM projects WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "org_isolation_stage_photos" ON stage_photos USING (
   stage_id IN (SELECT id FROM production_stages WHERE project_id IN (SELECT id FROM projects WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())))
);
CREATE POLICY "org_isolation_materials" ON materials USING (
   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_isolation_project_materials" ON project_materials USING (
   project_id IN (SELECT id FROM projects WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "org_isolation_documents" ON documents USING (
   project_id IN (SELECT id FROM projects WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY "org_isolation_financials" ON financials USING (
   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_isolation_maintenance_orders" ON maintenance_orders USING (
   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Políticas para 'stage-photos'
CREATE POLICY "Logados inserem imagens" ON storage.objects FOR INSERT TO authenticated WITH CHECK 
(bucket_id = 'stage-photos');
CREATE POLICY "Logados leem imagens" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'stage-photos');

-- Políticas para 'documents'
CREATE POLICY "Logados inserem documentos" ON storage.objects FOR INSERT TO authenticated WITH CHECK 
(bucket_id = 'documents');
CREATE POLICY "Logados leem documentos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');

-- Políticas para 'org-assets'
CREATE POLICY "Logados inserem assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK 
(bucket_id = 'org-assets');
CREATE POLICY "Logados leem assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'org-assets');
