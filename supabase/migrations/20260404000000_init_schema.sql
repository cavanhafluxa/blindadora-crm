-- Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. organizations (raiz multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#22C55E',
  domain TEXT,
  plan TEXT DEFAULT 'active' CHECK (plan IN ('trial','active','suspended')),
  setup_paid BOOLEAN DEFAULT FALSE,
  monthly_value NUMERIC(10,2) DEFAULT 2500.00,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. profiles (usuários)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner','admin','manager','technician','viewer')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  plate TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  vehicle_color TEXT,
  armor_type TEXT,
  quoted_value NUMERIC(10,2),
  pipeline_stage TEXT DEFAULT 'new' CHECK (pipeline_stage IN ('new','prospecting','quoted','contracted')),
  origin TEXT DEFAULT 'manual' CHECK (origin IN ('manual','google_ads','meta','referral','website','whatsapp','other')),
  notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. projects (cards de blindagem)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  plate TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT,
  vehicle_color TEXT,
  armor_type TEXT NOT NULL,
  contract_value NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled','on_hold')),
  overall_progress NUMERIC(5,2) DEFAULT 0,
  odometer_in INT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. production_stages
CREATE TABLE production_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage_number INT NOT NULL CHECK (stage_number BETWEEN 1 AND 12),
  stage_name TEXT NOT NULL,
  percentage INT DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','na')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  responsible_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, stage_number)
);

-- 6. stage_photos
CREATE TABLE stage_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id UUID NOT NULL REFERENCES production_stages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT DEFAULT 'progress' CHECK (photo_type IN ('before','during','after','damage','progress')),
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- 7. materials (catálogo de estoque)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('glass','steel','aramid','hardware','paint','finishing','other')),
  unit TEXT DEFAULT 'un' CHECK (unit IN ('un','kg','m','m2','L','cx')),
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(10,3) DEFAULT 0,
  min_stock NUMERIC(10,3) DEFAULT 0,
  supplier TEXT,
  sku TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. project_materials (consumo por projeto)
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quantity NUMERIC(10,3) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('authorization','declaration','contract','proposal','other')),
  status TEXT DEFAULT 'awaiting_docs' CHECK (status IN ('awaiting_docs','awaiting_approval','approved','rejected')),
  docusign_envelope_id TEXT,
  storage_path TEXT,
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. financials
CREATE TABLE financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL CHECK (type IN ('receivable','payable')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('pix','boleto','cash','card','installment','transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','partial','overdue','cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  supplier_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. maintenance_orders
CREATE TABLE maintenance_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_name TEXT NOT NULL,
  plate TEXT NOT NULL,
  vehicle_model TEXT,
  type TEXT DEFAULT 'revision' CHECK (type IN ('revision','repair','warranty','inspection')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  diagnosis TEXT,
  cost NUMERIC(10,2),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  responsible_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função: calcular progresso geral do projeto
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN  
  UPDATE projects SET    
    overall_progress = (
      SELECT COALESCE(AVG(percentage), 0)      
      FROM production_stages      
      WHERE project_id = NEW.project_id    
    ),    
    updated_at = NOW()  
  WHERE id = NEW.project_id;  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_project_progress 
AFTER INSERT OR UPDATE ON production_stages
FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Função: calcular custo de materiais do projeto
CREATE OR REPLACE FUNCTION get_project_material_cost(p_id UUID)
RETURNS NUMERIC AS $$  
  SELECT COALESCE(SUM(total_cost), 0)  
  FROM project_materials  
  WHERE project_id = p_id;
$$ LANGUAGE sql STABLE;

-- Seed: 12 etapas padrão (função automática)
CREATE OR REPLACE FUNCTION create_default_stages()
RETURNS TRIGGER AS $$
DECLARE  
  stage_names TEXT[] := ARRAY[    
    'Aguardando Coleta', 'Checklist Inicial', 'Preparação',    
    'Desmontagem', 'Desenvolvimento', 'Aplicação Parte Opaca',    
    'Aguardando Vidros', 'Aplicação Parte Transparente',    
    'Montagem e Finalização', 'Testes Finais',    
    'Preparação Estética', 'Entrega'  
  ];  
  i INT;
BEGIN  
  FOR i IN 1..12 LOOP    
    INSERT INTO production_stages (project_id, organization_id, stage_number, stage_name)    
    VALUES (NEW.id, NEW.organization_id, i, stage_names[i]);  
  END LOOP;  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_stages 
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION create_default_stages();

-- RLS: Row Level Security (multi-tenant)
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

-- Política base exemplo (o usuário pode refinar mais tarde se precisar de policies detalhadas):
CREATE POLICY "org_isolation" ON leads USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_projects" ON projects USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_production_stages" ON production_stages USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_stage_photos" ON stage_photos USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_materials" ON materials USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_project_materials" ON project_materials USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_documents" ON documents USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_financials" ON financials USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_maintenance_orders" ON maintenance_orders USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_organizations" ON organizations USING (id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_profiles" ON profiles USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Lembrete: O usuário precisa criar os Storage Buckets diretamente no painel do Supabase.
-- Bucket 1: stage-photos (público: false, max size: 10MB, tipos: image/*)
-- Bucket 2: documents (público: false, max size: 25MB, tipos: application/pdf)
-- Bucket 3: org-assets (público: true, max size: 2MB, tipos: image/*)
