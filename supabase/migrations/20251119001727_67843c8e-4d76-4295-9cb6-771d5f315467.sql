-- Migration 1: Update Shows and Tours Tables (add missing fields)
-- Add any missing columns to existing shows table
ALTER TABLE public.shows 
ADD COLUMN IF NOT EXISTS stage_info TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS doors_time TIME,
ADD COLUMN IF NOT EXISTS show_time TIME,
ADD COLUMN IF NOT EXISTS settlement_currency TEXT,
ADD COLUMN IF NOT EXISTS merch_split_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS load_in_time TIME,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS master_tour_sync_status TEXT DEFAULT 'not_synced',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add missing columns to tours table
ALTER TABLE public.tours
ADD COLUMN IF NOT EXISTS master_tour_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS artist TEXT,
ADD COLUMN IF NOT EXISTS tour_manager_name TEXT,
ADD COLUMN IF NOT EXISTS tour_manager_email TEXT,
ADD COLUMN IF NOT EXISTS tour_manager_phone TEXT;

-- Migration 2: Email Thread Tracking
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  thread_status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.email_threads(id) ON DELETE CASCADE NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  recipient_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  is_from_venue BOOLEAN DEFAULT false,
  is_from_agent BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add primary thread reference to shows
ALTER TABLE public.shows 
ADD COLUMN IF NOT EXISTS primary_thread_id UUID REFERENCES public.email_threads(id);

-- Migration 3: Agent Drafts and Extractions
CREATE TABLE IF NOT EXISTS public.agent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
  draft_type TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending_review',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  ai_model TEXT,
  ai_confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id UUID REFERENCES public.email_messages(id) ON DELETE CASCADE NOT NULL,
  extraction_type TEXT NOT NULL,
  extracted_data JSONB,
  confidence_score DECIMAL(3,2),
  needs_review BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration 4: Agent Activity and Learning
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  metadata JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID,
  venue_name TEXT,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB,
  success_rate DECIMAL(5,2),
  sample_size INTEGER DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration 5: Advancing Templates and Checklists
CREATE TABLE IF NOT EXISTS public.advancing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_content TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advancing_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
  checklist_item TEXT NOT NULL,
  category TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration 6: Master Tour Sync Tracking
CREATE TABLE IF NOT EXISTS public.master_tour_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  shows_synced INTEGER DEFAULT 0,
  shows_created INTEGER DEFAULT 0,
  shows_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.master_tour_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_tour_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(master_tour_id, cache_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_threads_show_id ON public.email_threads(show_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON public.email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_drafts_show_id ON public.agent_drafts(show_id);
CREATE INDEX IF NOT EXISTS idx_email_extractions_message_id ON public.email_extractions(email_message_id);
CREATE INDEX IF NOT EXISTS idx_advancing_checklists_show_id ON public.advancing_checklists(show_id);
CREATE INDEX IF NOT EXISTS idx_shows_master_tour_id ON public.shows(master_tour_id);

-- Migration 7: Row Level Security (RLS)
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advancing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advancing_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tour_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tour_cache ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" ON public.email_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.email_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.agent_drafts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.email_extractions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.agent_activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.agent_learning_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.advancing_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.advancing_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.master_tour_sync_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.master_tour_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migration 8: Helper Functions
CREATE OR REPLACE FUNCTION public.calculate_checklist_progress(p_show_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_items 
  FROM public.advancing_checklists 
  WHERE show_id = p_show_id;
  
  SELECT COUNT(*) INTO completed_items 
  FROM public.advancing_checklists 
  WHERE show_id = p_show_id AND completed = true;
  
  IF total_items = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_show_advancing_progress()
RETURNS TRIGGER AS $$
DECLARE
  progress DECIMAL;
BEGIN
  progress := public.calculate_checklist_progress(NEW.show_id);
  
  UPDATE public.shows
  SET advancing_status = CASE
    WHEN progress = 0 THEN 'not_started'
    WHEN progress = 100 THEN 'completed'
    WHEN progress > 0 THEN 'in_progress'
    ELSE 'not_started'
  END
  WHERE id = NEW.show_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for checklist progress
DROP TRIGGER IF EXISTS update_advancing_progress ON public.advancing_checklists;
CREATE TRIGGER update_advancing_progress
AFTER INSERT OR UPDATE OR DELETE ON public.advancing_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_show_advancing_progress();

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_email_threads_updated_at ON public.email_threads;
CREATE TRIGGER update_email_threads_updated_at
BEFORE UPDATE ON public.email_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_drafts_updated_at ON public.agent_drafts;
CREATE TRIGGER update_agent_drafts_updated_at
BEFORE UPDATE ON public.agent_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_advancing_templates_updated_at ON public.advancing_templates;
CREATE TRIGGER update_advancing_templates_updated_at
BEFORE UPDATE ON public.advancing_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_advancing_checklists_updated_at ON public.advancing_checklists;
CREATE TRIGGER update_advancing_checklists_updated_at
BEFORE UPDATE ON public.advancing_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();