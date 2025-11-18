# Lovable Agent Instructions

**Date**: 2025-11-18
**Task**: Implement database migrations for Advancing Agent System
**Status**: Ready for execution

---

## Current Status

The merch inventory system is deployed and the Master Inventory import issue is being diagnosed. Now we need to prepare the database schema for the advancing agent system powered by Letta.

---

## Task: Advancing Agent Database Schema

### Overview

We're building an AI-powered advancing workflow using Letta agents that will:
1. Generate advancing emails to venues
2. Parse venue responses to extract structured data
3. Manage bidirectional sync with Master Tour API
4. Track progress through advancing checklists

### Required Migrations

Execute these migrations in the Supabase SQL Editor in order:

---

### Migration 1: Shows and Tours Tables

```sql
-- Migration: Create shows and tours tables for advancing
-- Date: 2025-11-18

-- Tours table (corresponds to Master Tour tours)
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_tour_id TEXT UNIQUE,  -- Master Tour tour ID
  name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  rider_pdf_url TEXT,
  status TEXT DEFAULT 'planning',  -- planning, active, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shows table (individual tour dates)
CREATE TABLE IF NOT EXISTS shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,

  -- Master Tour integration
  master_tour_day_id TEXT,
  master_tour_event_id TEXT,

  -- Basic info
  date DATE NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_capacity INTEGER,

  -- Primary contact
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  primary_contact_role TEXT,

  -- Schedule
  load_in_time TIMESTAMPTZ,
  sound_check_time TIMESTAMPTZ,
  doors_time TIMESTAMPTZ,
  show_time TIMESTAMPTZ,
  curfew_time TIMESTAMPTZ,
  load_out_time TIMESTAMPTZ,

  -- Technical
  stage_size TEXT,
  power_requirements TEXT,
  backline_provided BOOLEAN DEFAULT FALSE,
  pa_system_specs TEXT,
  technical_notes TEXT,

  -- Hospitality
  dressing_rooms INTEGER,
  buyout_amount NUMERIC(10,2),
  guest_list_allocation INTEGER,
  parking_spaces INTEGER,
  hospitality_notes TEXT,

  -- Advancing status
  advancing_status TEXT DEFAULT 'draft',  -- draft, initiated, in_progress, completed
  advancing_started_at TIMESTAMPTZ,
  advancing_completed_at TIMESTAMPTZ,
  advancing_progress_percentage INTEGER DEFAULT 0,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ,
  primary_thread_id UUID,  -- Will reference email_threads

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_advancing_status CHECK (
    advancing_status IN ('draft', 'initiated', 'in_progress', 'completed', 'stalled')
  )
);

-- Additional contacts for shows
CREATE TABLE IF NOT EXISTS show_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shows_tour ON shows(tour_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
CREATE INDEX IF NOT EXISTS idx_shows_advancing_status ON shows(advancing_status);
CREATE INDEX IF NOT EXISTS idx_shows_master_tour_day ON shows(master_tour_day_id);
CREATE INDEX IF NOT EXISTS idx_show_contacts_show ON show_contacts(show_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Migration 2: Email Thread Tracking

```sql
-- Migration: Email thread and message tracking
-- Date: 2025-11-18

-- Email threads (Gmail threads associated with shows)
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  gmail_thread_id TEXT NOT NULL UNIQUE,
  subject TEXT,
  participants TEXT[],  -- Array of email addresses
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',  -- active, completed, stalled
  stalled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_thread_status CHECK (status IN ('active', 'completed', 'stalled'))
);

-- Individual email messages
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL,  -- inbound, outbound
  from_email TEXT NOT NULL,
  to_emails TEXT[],
  cc_emails TEXT[],
  subject TEXT,
  body TEXT,
  is_draft BOOLEAN DEFAULT FALSE,
  was_processed BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_threads_show ON email_threads(show_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_gmail ON email_threads(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_status ON email_threads(status);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_gmail ON email_messages(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_processed ON email_messages(was_processed);

-- Trigger for thread updated_at
CREATE TRIGGER update_email_threads_updated_at BEFORE UPDATE ON email_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key to shows table (now that email_threads exists)
ALTER TABLE shows
  ADD CONSTRAINT fk_shows_primary_thread
  FOREIGN KEY (primary_thread_id)
  REFERENCES email_threads(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shows_primary_thread ON shows(primary_thread_id);
```

---

### Migration 3: Agent Drafts and Extractions

```sql
-- Migration: Agent-generated drafts and data extractions
-- Date: 2025-11-18

-- Agent-generated email drafts awaiting TM approval
CREATE TABLE IF NOT EXISTS agent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE SET NULL,
  gmail_draft_id TEXT UNIQUE,

  -- Draft details
  draft_type TEXT NOT NULL,  -- initial, followup, regenerated
  subject TEXT,
  body TEXT,
  recipients TEXT[],
  cc_recipients TEXT[],
  attachments JSONB,  -- [{url, filename, type}]

  -- Context
  questions_asked TEXT[],
  fields_requested TEXT[],

  -- Status tracking
  status TEXT DEFAULT 'pending_review',  -- pending_review, approved, rejected, sent
  agent_confidence NUMERIC(3,2),  -- 0.00 to 1.00
  tm_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  CONSTRAINT valid_draft_type CHECK (draft_type IN ('initial', 'followup', 'regenerated')),
  CONSTRAINT valid_draft_status CHECK (status IN ('pending_review', 'approved', 'rejected', 'sent')),
  CONSTRAINT valid_confidence CHECK (agent_confidence >= 0 AND agent_confidence <= 1)
);

-- Extracted data from venue email responses
CREATE TABLE IF NOT EXISTS email_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,

  -- Extraction results
  extracted_data JSONB NOT NULL,  -- {field_key: {value, confidence, source_text, reasoning}}
  unresolved_questions TEXT[],
  new_questions_needed TEXT[],
  sentiment JSONB,  -- {tone, responsiveness, clarity, concerns}
  overall_confidence NUMERIC(3,2),

  -- Status
  status TEXT DEFAULT 'pending_approval',  -- pending_approval, approved, rejected
  tm_corrections JSONB,  -- What TM changed from extracted data
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_extraction_status CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  CONSTRAINT valid_overall_confidence CHECK (overall_confidence >= 0 AND overall_confidence <= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_drafts_show ON agent_drafts(show_id);
CREATE INDEX IF NOT EXISTS idx_agent_drafts_status ON agent_drafts(status);
CREATE INDEX IF NOT EXISTS idx_agent_drafts_created ON agent_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_extractions_show ON email_extractions(show_id);
CREATE INDEX IF NOT EXISTS idx_email_extractions_status ON email_extractions(status);
CREATE INDEX IF NOT EXISTS idx_email_extractions_message ON email_extractions(message_id);
```

---

### Migration 4: Agent Activity and Learning

```sql
-- Migration: Agent activity logging and learning data
-- Date: 2025-11-18

-- Agent activity log for debugging, auditing, and improvement
CREATE TABLE IF NOT EXISTS agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,  -- coordinator, draft_generator, email_parser, sync_manager
  agent_id TEXT NOT NULL,
  show_id UUID REFERENCES shows(id) ON DELETE SET NULL,

  -- Activity details
  action TEXT NOT NULL,  -- start_advancing, generate_draft, parse_email, sync_to_mt, etc.
  input_data JSONB,
  output_data JSONB,

  -- Results
  success BOOLEAN,
  error_message TEXT,
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_agent_type CHECK (
    agent_type IN ('coordinator', 'draft_generator', 'email_parser', 'sync_manager')
  )
);

-- Agent learning data (patterns learned from venues)
CREATE TABLE IF NOT EXISTS agent_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  show_id UUID REFERENCES shows(id) ON DELETE SET NULL,

  -- Pattern details
  venue_name TEXT,
  venue_type TEXT,  -- club, theater, arena, festival
  pattern_type TEXT,  -- email_format, response_style, typical_info_provided
  pattern_data JSONB,  -- Flexible structure for different pattern types

  -- Learning metrics
  confidence NUMERIC(3,2),
  times_observed INTEGER DEFAULT 1,
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_learning_agent_type CHECK (
    agent_type IN ('coordinator', 'draft_generator', 'email_parser', 'sync_manager')
  ),
  CONSTRAINT valid_learning_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_type ON agent_activity_log(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_activity_show ON agent_activity_log(show_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_action ON agent_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_learning_venue ON agent_learning_data(venue_name);
CREATE INDEX IF NOT EXISTS idx_agent_learning_type ON agent_learning_data(venue_type);
CREATE INDEX IF NOT EXISTS idx_agent_learning_pattern ON agent_learning_data(pattern_type);
```

---

### Migration 5: Advancing Templates and Checklists

```sql
-- Migration: Advancing templates and checklist system
-- Date: 2025-11-18

-- Advancing templates (customizable per tour/artist)
CREATE TABLE IF NOT EXISTS advancing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,  -- NULL = global template

  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,

  -- Field definitions
  sections JSONB NOT NULL,  -- [{name, fields: [{key, label, type, required, options}]}]

  -- Email template
  email_template TEXT,  -- Template for initial email body

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advancing checklists (per-show progress tracking)
CREATE TABLE IF NOT EXISTS advancing_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  template_id UUID REFERENCES advancing_templates(id) ON DELETE SET NULL,

  -- Checklist state
  field_states JSONB NOT NULL,  -- {field_key: {status, value, source, confidence, updated_at}}

  -- Progress metrics
  overall_progress NUMERIC(4,2) DEFAULT 0.00,  -- 0.00 to 100.00
  required_progress NUMERIC(4,2) DEFAULT 0.00,
  optional_progress NUMERIC(4,2) DEFAULT 0.00,

  -- Status
  status TEXT DEFAULT 'in_progress',  -- in_progress, completed
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_checklist_status CHECK (status IN ('in_progress', 'completed')),
  CONSTRAINT valid_overall_progress CHECK (overall_progress >= 0 AND overall_progress <= 100),
  CONSTRAINT valid_required_progress CHECK (required_progress >= 0 AND required_progress <= 100),
  CONSTRAINT valid_optional_progress CHECK (optional_progress >= 0 AND optional_progress <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advancing_templates_tour ON advancing_templates(tour_id);
CREATE INDEX IF NOT EXISTS idx_advancing_templates_default ON advancing_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_advancing_checklists_show ON advancing_checklists(show_id);
CREATE INDEX IF NOT EXISTS idx_advancing_checklists_status ON advancing_checklists(status);

-- Triggers
CREATE TRIGGER update_advancing_templates_updated_at BEFORE UPDATE ON advancing_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advancing_checklists_updated_at BEFORE UPDATE ON advancing_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Migration 6: Master Tour Sync Tracking

```sql
-- Migration: Master Tour API sync tracking
-- Date: 2025-11-18

-- Sync history and conflict tracking
CREATE TABLE IF NOT EXISTS master_tour_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,

  -- Sync details
  direction TEXT NOT NULL,  -- to_master_tour, from_master_tour
  sync_type TEXT NOT NULL,  -- manual, automatic, scheduled

  -- What was synced
  fields_synced TEXT[],
  itinerary_items_created INTEGER DEFAULT 0,
  itinerary_items_updated INTEGER DEFAULT 0,
  day_notes_updated BOOLEAN DEFAULT FALSE,

  -- Results
  success BOOLEAN,
  conflicts_detected INTEGER DEFAULT 0,
  conflicts_data JSONB,  -- [{field, local_value, mt_value, resolved, resolution}]
  error_message TEXT,

  -- Timing
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_sync_direction CHECK (direction IN ('to_master_tour', 'from_master_tour')),
  CONSTRAINT valid_sync_type CHECK (sync_type IN ('manual', 'automatic', 'scheduled'))
);

-- Master Tour data cache (reduce API calls)
CREATE TABLE IF NOT EXISTS master_tour_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,  -- tour, day, event, itinerary, hotel, contact
  resource_id TEXT NOT NULL,  -- Master Tour resource ID
  data JSONB NOT NULL,  -- Cached data
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource_type, resource_id),
  CONSTRAINT valid_cache_resource_type CHECK (
    resource_type IN ('tour', 'day', 'event', 'itinerary', 'hotel', 'contact')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mt_sync_log_show ON master_tour_sync_log(show_id);
CREATE INDEX IF NOT EXISTS idx_mt_sync_log_direction ON master_tour_sync_log(direction);
CREATE INDEX IF NOT EXISTS idx_mt_sync_log_created ON master_tour_sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mt_cache_resource ON master_tour_cache(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_mt_cache_expires ON master_tour_cache(expires_at);
```

---

### Migration 7: Row Level Security (RLS)

```sql
-- Migration: Row Level Security policies
-- Date: 2025-11-18

-- Enable RLS on all tables
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE advancing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE advancing_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_tour_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_tour_cache ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users (refine later per user/organization)
-- In production, you'd add organization_id to tables and scope to that

-- Tours policies
CREATE POLICY "Users can view all tours" ON tours
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tours" ON tours
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tours" ON tours
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Shows policies
CREATE POLICY "Users can view all shows" ON shows
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert shows" ON shows
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update shows" ON shows
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Show contacts policies
CREATE POLICY "Users can view show contacts" ON show_contacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert show contacts" ON show_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update show contacts" ON show_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Email threads policies
CREATE POLICY "Users can view email threads" ON email_threads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert email threads" ON email_threads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update email threads" ON email_threads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Email messages policies
CREATE POLICY "Users can view email messages" ON email_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert email messages" ON email_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Agent drafts policies
CREATE POLICY "Users can view agent drafts" ON agent_drafts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert agent drafts" ON agent_drafts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update agent drafts" ON agent_drafts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Email extractions policies
CREATE POLICY "Users can view email extractions" ON email_extractions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert email extractions" ON email_extractions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update email extractions" ON email_extractions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Agent activity log (read-only for users, agents can write via service role)
CREATE POLICY "Users can view agent activity log" ON agent_activity_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Agent learning data (read-only for users)
CREATE POLICY "Users can view agent learning data" ON agent_learning_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- Advancing templates policies
CREATE POLICY "Users can view advancing templates" ON advancing_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert advancing templates" ON advancing_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update advancing templates" ON advancing_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Advancing checklists policies
CREATE POLICY "Users can view advancing checklists" ON advancing_checklists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert advancing checklists" ON advancing_checklists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update advancing checklists" ON advancing_checklists
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Master Tour sync log (read-only for users)
CREATE POLICY "Users can view MT sync log" ON master_tour_sync_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Master Tour cache (read-only for users)
CREATE POLICY "Users can view MT cache" ON master_tour_cache
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

### Migration 8: Helper Functions

```sql
-- Migration: Helper functions for advancing workflow
-- Date: 2025-11-18

-- Function to calculate advancing checklist progress
CREATE OR REPLACE FUNCTION calculate_checklist_progress(checklist_id UUID)
RETURNS TABLE (
  overall_progress NUMERIC,
  required_progress NUMERIC,
  optional_progress NUMERIC
) AS $$
DECLARE
  v_template JSONB;
  v_field_states JSONB;
  total_fields INT := 0;
  completed_fields INT := 0;
  total_required INT := 0;
  completed_required INT := 0;
  total_optional INT := 0;
  completed_optional INT := 0;
BEGIN
  -- Get template and field states
  SELECT
    at.sections,
    ac.field_states
  INTO v_template, v_field_states
  FROM advancing_checklists ac
  JOIN advancing_templates at ON at.id = ac.template_id
  WHERE ac.id = checklist_id;

  -- Calculate progress (simplified - actual implementation would parse JSONB)
  -- This is a placeholder - real implementation would iterate through sections/fields

  RETURN QUERY SELECT
    0.00::NUMERIC as overall_progress,
    0.00::NUMERIC as required_progress,
    0.00::NUMERIC as optional_progress;
END;
$$ LANGUAGE plpgsql;

-- Function to update show advancing progress
CREATE OR REPLACE FUNCTION update_show_advancing_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update show's advancing_progress_percentage based on checklist
  UPDATE shows
  SET advancing_progress_percentage = (
    SELECT overall_progress::INTEGER
    FROM advancing_checklists
    WHERE show_id = NEW.show_id
    LIMIT 1
  )
  WHERE id = NEW.show_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_show_progress_on_checklist_change
  AFTER UPDATE ON advancing_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_show_advancing_progress();
```

---

## Verification Steps

After running all migrations, verify the schema is correct:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'tours',
  'shows',
  'show_contacts',
  'email_threads',
  'email_messages',
  'agent_drafts',
  'email_extractions',
  'agent_activity_log',
  'agent_learning_data',
  'advancing_templates',
  'advancing_checklists',
  'master_tour_sync_log',
  'master_tour_cache'
);
-- Should return 13 rows

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%advancing%'
OR tablename IN ('tours', 'shows', 'email%', 'agent%', 'master_tour%');
-- All should have rowsecurity = true

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('shows', 'email_threads', 'agent_drafts');
-- Should see multiple indexes per table
```

---

## Testing Data (Optional)

Create sample data to test the schema:

```sql
-- Sample tour
INSERT INTO tours (name, artist_name, start_date, end_date)
VALUES ('Spring 2025 Tour', 'Dirtwire', '2025-03-01', '2025-04-30')
RETURNING id;

-- Sample show (use tour_id from above)
INSERT INTO shows (
  tour_id,
  date,
  venue_name,
  venue_city,
  venue_state,
  primary_contact_name,
  primary_contact_email
) VALUES (
  '<tour-id-from-above>',
  '2025-03-15',
  'The Ritz',
  'Raleigh',
  'NC',
  'Sarah Johnson',
  'sarah@theritz.com'
)
RETURNING id;

-- Sample advancing template
INSERT INTO advancing_templates (
  name,
  description,
  is_default,
  sections
) VALUES (
  'Standard Club Show',
  'Default template for club/theater shows',
  true,
  '[
    {
      "name": "Schedule",
      "fields": [
        {"key": "loadIn", "label": "Load In Time", "type": "time", "required": true},
        {"key": "soundCheck", "label": "Sound Check", "type": "time", "required": true},
        {"key": "doors", "label": "Doors", "type": "time", "required": true},
        {"key": "showTime", "label": "Show Time", "type": "time", "required": true}
      ]
    },
    {
      "name": "Technical",
      "fields": [
        {"key": "stageSize", "label": "Stage Size", "type": "text", "required": false},
        {"key": "power", "label": "Power Requirements", "type": "text", "required": true}
      ]
    }
  ]'::jsonb
);
```

---

## Success Criteria

✅ All 13 tables created successfully
✅ All foreign key constraints in place
✅ All indexes created
✅ RLS enabled on all tables
✅ RLS policies allow authenticated users access
✅ Triggers for updated_at columns working
✅ Verification queries return expected results

---

## Next Steps After Migration

Once migrations are complete:

1. **Update TypeScript types** in `src/types/advancing.ts` to match schema
2. **Build API layer** for shows, drafts, extractions
3. **Create UI components** for:
   - Show management
   - Draft approval queue
   - Extraction review
   - Advancing checklist
4. **Integrate Letta agents** (separate service)
5. **Set up Gmail API** integration
6. **Implement Master Tour sync** service

---

## Rollback Plan

If migrations fail or need to be reverted:

```sql
-- WARNING: This deletes all advancing data!

DROP TABLE IF EXISTS master_tour_cache CASCADE;
DROP TABLE IF EXISTS master_tour_sync_log CASCADE;
DROP TABLE IF EXISTS advancing_checklists CASCADE;
DROP TABLE IF EXISTS advancing_templates CASCADE;
DROP TABLE IF EXISTS agent_learning_data CASCADE;
DROP TABLE IF EXISTS agent_activity_log CASCADE;
DROP TABLE IF EXISTS email_extractions CASCADE;
DROP TABLE IF EXISTS agent_drafts CASCADE;
DROP TABLE IF EXISTS email_messages CASCADE;
DROP TABLE IF EXISTS email_threads CASCADE;
DROP TABLE IF EXISTS show_contacts CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS tours CASCADE;

DROP FUNCTION IF EXISTS calculate_checklist_progress CASCADE;
DROP FUNCTION IF EXISTS update_show_advancing_progress CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

---

## Notes for Developers

- All timestamps use `TIMESTAMPTZ` (timezone-aware)
- JSONB columns used for flexible data structures (agent extractions, templates)
- Arrays used for simple lists (participants, questions_asked)
- Confidence scores stored as `NUMERIC(3,2)` (0.00 to 1.00)
- Progress percentages stored as `NUMERIC(4,2)` (0.00 to 100.00)
- All tables have `created_at`, most have `updated_at`
- Triggers auto-update `updated_at` on changes
- RLS policies currently allow all authenticated users (refine for production)

---

**Completion Report**

After executing these migrations, document:

**Date Completed**: _____________
**Migration Status**: _____________
**Tables Created**: ___ / 13
**RLS Policies**: ___ / 13 tables
**Indexes Created**: ___ total
**Verification Tests Passed**: Yes / No
**Notes**: _____________
