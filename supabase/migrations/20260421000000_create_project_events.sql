-- Create project events table for detailed production history
CREATE TABLE IF NOT EXISTS public.project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'stage_update', 'checklist_completed', 'status_change', etc.
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view events from their organization" ON public.project_events
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events for their organization" ON public.project_events
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON public.project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_organization_id ON public.project_events(organization_id);
