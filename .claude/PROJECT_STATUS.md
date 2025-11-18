# Project Status & Roadmap

**Last Updated**: 2025-11-18
**Current Phase**: Merch Inventory System (Deployment) + Advancing System (Planning)
**Next Agent**: Read this document first to understand current state and next actions

---

## Quick Status Overview

| System | Status | Progress | Next Action |
|--------|--------|----------|-------------|
| **Merch Inventory** | 🟡 Deployed, Debugging | 85% | Fix import showing only 15/899 items |
| **Advancing System** | 🔵 Planned, Ready to Build | 10% | Run database migrations, build UI |
| **Master Tour API** | 🔵 Researched | 5% | Obtain API keys, implement OAuth |
| **Letta Agents** | 🔵 Specified | 0% | Set up Letta service, deploy agents |

**Legend**: 🟢 Complete | 🟡 In Progress | 🔵 Planned | 🔴 Blocked

---

## Current State (What's Done)

### ✅ Completed

#### Merch Inventory System
- [x] Database schema designed and migrated (12 tables, 2 views)
- [x] Import services for Ambient Inks CSV files
- [x] UI pages: Products, Inventory, Master Inventory, Import Data
- [x] Products page fixed to work with new schema
- [x] Inventory page fixed to work with new schema
- [x] Server-side import via Supabase Edge Function (prevents timeout)
- [x] Data validation to skip malformed CSV rows
- [x] Database Diagnostics page for troubleshooting

#### Advancing System - Planning
- [x] Master Tour API research completed (see `.claude/advancing-research.md`)
- [x] Complete workflow specification (see `.claude/workflow.md`)
- [x] Technical specification with Letta agents (see `.claude/advancing-agent-spec.md`)
- [x] Database schema designed (13 tables for advancing)
- [x] Lovable instructions for database migrations (see `LOVABLE/instructions.md`)

#### Documentation
- [x] Development summary (`DEVELOPMENT_SUMMARY.md`)
- [x] Import guide (`IMPORT_GUIDE.md`)
- [x] Merch system README (`MERCH_SYSTEM_README.md`)
- [x] Migration handoff (`MIGRATION_HANDOFF.md`)
- [x] What to expect after import (`WHAT_TO_EXPECT_AFTER_IMPORT.md`)
- [x] Advancing research (`..claude/advancing-research.md`)
- [x] Advancing workflow (`..claude/workflow.md`)
- [x] Advancing agent spec (`..claude/advancing-agent-spec.md`)

---

## 🔴 Current Issues (Blocking Progress)

### Issue #1: Master Inventory Only Shows 15 Items
**Status**: 🔴 Blocking
**Priority**: P0 (Critical)
**Assigned To**: Lovable Agent
**Description**: Master Inventory page shows only 15 items instead of expected ~899 variants from CSV import.

**Diagnosis Plan** (in `LOVABLE/instructions.md`):
1. Run diagnostic SQL queries to check actual database state
2. Determine scenario:
   - Scenario A: Only 15 variants in DB (import failed/timed out)
   - Scenario B: All 899 in DB but UI shows 15 (query limit issue)
   - Scenario C: View returns wrong count (view definition broken)
3. Apply appropriate fix based on scenario
4. Verify all ~899 items display

**Resolution Path**:
- Lovable agent has full diagnostic + fix instructions in `LOVABLE/instructions.md`
- Likely cause: Import timeout (now fixed with edge function)
- Expected resolution: Re-run import via `/import` page, should complete successfully

**Files Involved**:
- `LOVABLE/instructions.md` - Full diagnostic instructions
- `src/pages/DatabaseDiagnostics.tsx` - UI diagnostic tool
- `src/pages/MasterInventory.tsx` - Display page
- `src/services/import/ambientInksProductImporter.ts` - Import logic
- `supabase/functions/import-ambient-inks/index.ts` - Edge function

---

## 🟡 In Progress

### Merch Inventory System Deployment
**What's Happening**: System is deployed in Lovable, import process being debugged

**Current State**:
- Database schema: ✅ Migrated
- Import services: ✅ Built (edge function for server-side processing)
- UI pages: ✅ Built and fixed for new schema
- Data import: 🔴 Only 15/899 items showing (see Issue #1)

**Next Steps**:
1. Lovable agent runs diagnostics (per `LOVABLE/instructions.md`)
2. Lovable agent fixes import issue
3. Verify all ~899 items display correctly
4. User can then use system for merch tracking

---

## 🔵 Ready to Start (Waiting for Prerequisites)

### Advancing System - Database Migrations
**Prerequisites**:
- ✅ Schema designed
- ✅ Migration SQL written
- ⏳ Waiting for user to merge and Lovable to run migrations

**What to Do**:
1. User merges PR with advancing specs
2. Lovable agent runs 8 migrations from `LOVABLE/instructions.md`:
   - Migration 1: Shows and tours tables
   - Migration 2: Email thread tracking
   - Migration 3: Agent drafts and extractions
   - Migration 4: Agent activity and learning
   - Migration 5: Advancing templates and checklists
   - Migration 6: Master Tour sync tracking
   - Migration 7: Row Level Security policies
   - Migration 8: Helper functions
3. Lovable runs verification queries
4. Mark as ✅ when all 13 tables created

**Success Criteria**:
- All 13 tables exist
- RLS enabled on all tables
- Indexes created
- Verification queries pass

---

## 📋 Backlog (Prioritized)

### Priority 0 (Immediate - This Week)

#### P0-1: Fix Merch Import Issue
- **What**: Resolve "only 15 items showing" issue
- **Why**: Blocking users from using merch system
- **Who**: Lovable agent
- **How**: Follow `LOVABLE/instructions.md` diagnostics
- **Estimate**: 1-2 hours
- **Status**: 🔴 Blocking

#### P0-2: Run Advancing Database Migrations
- **What**: Execute 8 SQL migrations for advancing system
- **Why**: Needed before any advancing work can start
- **Who**: Lovable agent
- **How**: Run SQL from `LOVABLE/instructions.md` in Supabase
- **Estimate**: 30 minutes
- **Dependencies**: User merges PR
- **Status**: 🔵 Ready (waiting on merge)

---

### Priority 1 (Next - This Week)

#### P1-1: Create TypeScript Types for Advancing
- **What**: Create `src/types/advancing.ts` matching database schema
- **Why**: Type safety for frontend development
- **Who**: Any agent with access to schema
- **How**:
  ```typescript
  // Based on tables: tours, shows, email_threads, agent_drafts, etc.
  export interface Tour {
    id: string;
    master_tour_id: string | null;
    name: string;
    artist_name: string;
    // ... all fields from schema
  }
  // ... 12 more interfaces
  ```
- **Reference**: `LOVABLE/instructions.md` has complete schema
- **Estimate**: 2 hours
- **Dependencies**: P0-2 (migrations completed)
- **Status**: 🔵 Planned

#### P1-2: Build Show Management UI (Basic CRUD)
- **What**: Create pages for viewing/creating/editing shows
- **Why**: Foundation for advancing workflow
- **Who**: Any agent
- **Pages to Create**:
  - `src/pages/Tours.tsx` - List tours, create new
  - `src/pages/Shows.tsx` - List shows for tour, create new
  - `src/pages/ShowDetail.tsx` - View/edit single show
- **Components**:
  - `src/components/advancing/ShowCard.tsx`
  - `src/components/advancing/ShowForm.tsx`
  - `src/components/advancing/AdvancingChecklist.tsx`
- **Estimate**: 8 hours
- **Dependencies**: P1-1 (types created)
- **Status**: 🔵 Planned

#### P1-3: Obtain Master Tour API Keys
- **What**: Get OAuth credentials for Master Tour API
- **Why**: Required for all Master Tour integration
- **Who**: User (manual task)
- **How**:
  1. Login to Master Tour at my.eventric.com
  2. Navigate to API Key/Secret page
  3. Generate new keypair
  4. Store in `.env.local`:
     ```
     VITE_MASTER_TOUR_PUBLIC_KEY=xxx
     VITE_MASTER_TOUR_SECRET_KEY=xxx
     ```
  5. Add to Supabase environment variables (for edge functions)
- **Estimate**: 15 minutes
- **Status**: 🔵 Planned (user action required)

---

### Priority 2 (Soon - Next Week)

#### P2-1: Implement Master Tour OAuth Client
- **What**: Build OAuth 1.0 signature generation for Master Tour API
- **Why**: Required for all API calls
- **Who**: Any agent
- **Files to Create**:
  - `src/services/masterTour/auth/oauthClient.ts`
  - `src/services/masterTour/auth/keyManager.ts`
- **Reference**: `.claude/advancing-agent-spec.md` has code samples
- **Estimate**: 4 hours
- **Dependencies**: P1-3 (API keys obtained)
- **Status**: 🔵 Planned

#### P2-2: Build Master Tour API Client (Read Operations)
- **What**: Implement GET endpoints for tours, days, events
- **Why**: Fetch data from Master Tour
- **Who**: Any agent
- **Files to Create**:
  - `src/services/masterTour/api/tours.ts`
  - `src/services/masterTour/api/days.ts`
  - `src/services/masterTour/api/events.ts`
- **Endpoints to Implement**:
  - GET /api/v5/tours
  - GET /api/v5/tour/{tourId}
  - GET /api/v5/day/{dayId}
  - GET /api/v5/day/{dayId}/events
- **Reference**: `.claude/advancing-research.md` has full endpoint list
- **Estimate**: 6 hours
- **Dependencies**: P2-1 (OAuth implemented)
- **Status**: 🔵 Planned

#### P2-3: Implement Sync from Master Tour
- **What**: Pull shows from Master Tour into our database
- **Why**: Users can work with existing MT data
- **Who**: Any agent
- **UI**: Add "Sync from Master Tour" button to Tours page
- **Process**:
  1. Fetch tours from MT API
  2. For each tour, fetch days/events
  3. Create/update shows in our database
  4. Map MT fields to our schema
- **Estimate**: 6 hours
- **Dependencies**: P2-2 (API client built), P1-2 (Show CRUD exists)
- **Status**: 🔵 Planned

---

### Priority 3 (Later - Week 3-4)

#### P3-1: Set Up Gmail API Integration
- **What**: OAuth for Gmail, create drafts, monitor inbox
- **Who**: Any agent
- **Files to Create**:
  - `src/services/gmail/gmailClient.ts`
  - `src/services/gmail/draftManager.ts`
  - `src/services/gmail/webhookHandler.ts`
- **OAuth Scopes Needed**:
  - `gmail.readonly`
  - `gmail.compose`
  - `gmail.modify`
  - `gmail.send` (optional)
- **Reference**: `.claude/advancing-agent-spec.md` has Gmail integration code
- **Estimate**: 8 hours
- **Status**: 🔵 Planned

#### P3-2: Set Up Letta Agent Service
- **What**: Deploy Letta framework, create initial agents
- **Who**: Any agent + DevOps
- **Components**:
  - Docker container for Letta
  - Advancing Coordinator agent
  - Draft Generator agent
  - Email Parser agent
  - Sync Manager agent
- **Reference**: `.claude/advancing-agent-spec.md` has full agent specs
- **Estimate**: 16 hours
- **Status**: 🔵 Planned

#### P3-3: Build Draft Approval UI
- **What**: Page for TM to review/approve agent-generated drafts
- **Who**: Any agent
- **Files to Create**:
  - `src/pages/DraftApprovals.tsx`
  - `src/components/advancing/DraftCard.tsx`
- **Reference**: `.claude/advancing-agent-spec.md` has UI mockup
- **Estimate**: 6 hours
- **Dependencies**: P3-2 (Letta agents creating drafts)
- **Status**: 🔵 Planned

#### P3-4: Build Extraction Review UI
- **What**: Page for TM to review agent-parsed email data
- **Who**: Any agent
- **Files to Create**:
  - `src/pages/ExtractionReview.tsx`
  - `src/components/advancing/ExtractionField.tsx`
- **Reference**: `.claude/advancing-agent-spec.md` has UI mockup
- **Estimate**: 6 hours
- **Dependencies**: P3-2 (Letta agents parsing emails)
- **Status**: 🔵 Planned

---

### Priority 4 (Future - Month 2+)

#### P4-1: Implement Bidirectional MT Sync
- **What**: Write to Master Tour API (itinerary items, day notes)
- **Who**: Any agent
- **Endpoints to Implement**:
  - POST /api/v5/itinerary
  - PUT /api/v5/itinerary/{itemId}
  - PUT /api/v5/day/{dayId}
- **Estimate**: 8 hours
- **Status**: 🔵 Planned

#### P4-2: Build Advancing Templates System
- **What**: UI for creating/editing advancing templates
- **Who**: Any agent
- **Files to Create**:
  - `src/pages/AdvancingTemplates.tsx`
  - `src/components/advancing/TemplateEditor.tsx`
- **Estimate**: 10 hours
- **Status**: 🔵 Planned

#### P4-3: Build Venue Database
- **What**: Store historical venue data, tech specs
- **Who**: Any agent
- **Why**: Unique value-add beyond Master Tour
- **Estimate**: 12 hours
- **Status**: 🔵 Planned

#### P4-4: Analytics Dashboard
- **What**: Metrics on advancing efficiency, time saved
- **Who**: Any agent
- **Estimate**: 8 hours
- **Status**: 🔵 Planned

---

## 📝 Important Context for Next Agent

### Key Documents to Read First

1. **PROJECT_STATUS.md** (this file) - Overall project state and next steps
2. **LOVABLE/instructions.md** - Current Lovable agent tasks (migrations + diagnostics)
3. **.claude/advancing-research.md** - Master Tour API capabilities
4. **.claude/advancing-agent-spec.md** - Technical implementation details
5. **.claude/workflow.md** - Advancing workflow from user perspective

### Current Architecture

**Tech Stack**:
- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Edge Functions)
- UI: shadcn/ui components
- State: TanStack Query (React Query)
- Agents: Letta framework (planned)
- APIs: Master Tour API v5, Gmail API

**Key Directories**:
```
src/
├── pages/              # Full-page components (Products, Inventory, etc.)
├── components/         # Reusable UI components
│   └── advancing/      # Advancing-specific components (planned)
├── services/           # Business logic, API clients
│   ├── import/         # CSV importers for merch
│   └── masterTour/     # Master Tour API client (planned)
├── types/              # TypeScript type definitions
└── integrations/       # Supabase client

supabase/
├── migrations/         # Database migrations
└── functions/          # Edge functions (server-side code)

.claude/                # Agent documentation
LOVABLE/                # Instructions for Lovable agent
```

**Database Schema**:
- **Merch**: 12 tables (products, variants, pricing, inventory_states, etc.)
- **Advancing**: 13 tables (tours, shows, email_threads, agent_drafts, etc.)
- See `LOVABLE/instructions.md` for full schema

### Git Workflow

**Current Branch**: `claude/process-assets-01LJPzC9kt4yePD2C91pr3BV`
**Main Branch**: `main`

**Process**:
1. User merges work from feature branch to main
2. Lovable agent works on main branch
3. All changes should be committed with clear messages
4. Push regularly to avoid losing work

### Communication with User

**User's Role**: Tour manager for Dirtwire (band)
**User's Goal**: Track merch inventory across warehouse + tour, automate advancing workflow

**Preferences**:
- User wants things that work, not over-engineered
- Prefers clear explanations of what was done and why
- Likes to see progress incrementally
- Will test in Lovable preview environment

### Testing Strategy

**Merch System**:
- Test with real CSV data in `/assets/` folder
- Expected: ~899 product variants
- Verify in `/diagnostics` page

**Advancing System**:
- Will need Master Tour test account (user to provide)
- Gmail test account (user to provide)
- Letta agent testing in isolation first

---

## 🎯 Success Metrics

### Merch Inventory System
- ✅ **Deployed**: App is live and accessible
- 🟡 **Data Imported**: ~899 variants visible (currently 15)
- ⏳ **User Adoption**: User actively using for inventory tracking
- ⏳ **Time Saved**: User reports less time on manual tracking

### Advancing System
- ⏳ **Database Ready**: 13 tables migrated
- ⏳ **MT Integration**: Can read/write to Master Tour
- ⏳ **Agents Working**: Letta agents generating drafts
- ⏳ **User Adoption**: User advances 1+ shows via system
- ⏳ **Time Saved**: Target 2 hours saved per show

---

## 🚨 Troubleshooting Common Issues

### "I don't know what to work on next"
→ Read this file (`PROJECT_STATUS.md`), start with highest priority item marked 🔵 Ready

### "Import not working / only 15 items"
→ See `LOVABLE/instructions.md` - full diagnostic procedure

### "Can't connect to Master Tour API"
→ Check if P1-3 (API keys) completed, verify keys in environment variables

### "Agent deployment failing"
→ See `.claude/advancing-agent-spec.md` - deployment architecture section

### "Database migration errors"
→ Check `LOVABLE/instructions.md` for rollback plan

### "User asking about timeline"
→ Reference priority levels: P0 this week, P1 next week, P2 week after, etc.

---

## 📞 Handoff Checklist

**Before ending your session, update**:
1. ✅ This file (`PROJECT_STATUS.md`) with current state
2. ✅ Move completed items from "In Progress" to "Completed"
3. ✅ Add any new issues discovered to "Current Issues"
4. ✅ Update progress percentages in Quick Status table
5. ✅ Commit all changes with clear message
6. ✅ Push to remote branch

**In your commit message, include**:
- What was completed
- What's still in progress
- Any blockers or issues
- Recommendation for next agent

---

## Version History

| Date | Agent | Changes |
|------|-------|---------|
| 2025-11-18 | Claude Code | Created PROJECT_STATUS.md with full roadmap |
| 2025-11-18 | Claude Code | Completed advancing system specifications |
| 2025-11-18 | Claude Code | Fixed Products and Inventory pages for new schema |
| 2025-11-18 | Claude Code | Created Database Diagnostics page |
| 2025-11-18 | Lovable | Implemented server-side import (edge function) |
| 2025-11-18 | Lovable | Added data validation for malformed CSV |

---

**Next Agent: Start by reading "Current Issues" section and tackle P0-1 or P0-2 based on what's unblocked.**
