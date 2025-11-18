# Claude Agent Guide: Advancing Merch Hub

**Last Updated**: 2025-11-18
**Purpose**: Instructions for Claude agents working on this project

---

## 🎯 First Steps for Any Agent

### Read This FIRST: `.claude/PROJECT_STATUS.md`

**CRITICAL**: Before doing ANY work on this project, you MUST read `.claude/PROJECT_STATUS.md`. This is the single source of truth for:
- ✅ What's been completed
- 🔴 What's blocking progress
- 🟡 What's currently in progress
- 🔵 What's ready to start next
- 📋 Complete prioritized backlog

**Do NOT**:
- ❌ Start coding without reading PROJECT_STATUS.md
- ❌ Duplicate work that's already done
- ❌ Work on low-priority items when high-priority blockers exist
- ❌ Forget to update PROJECT_STATUS.md when you complete tasks

**DO**:
- ✅ Read PROJECT_STATUS.md at session start
- ✅ Pick highest priority unblocked task
- ✅ Update PROJECT_STATUS.md as you work
- ✅ Commit changes to PROJECT_STATUS.md before session ends

---

## 📋 Project Overview

This is a **tour management application** for Dirtwire (music act) with two integrated systems:

### 1. Merch Inventory System (85% Complete)
**Purpose**: Track merchandise across warehouse and tour locations

**Problem Solved**: Fulfillment partner (Ambient Inks) can only see warehouse inventory. When merch ships to tour, it disappears from their system. We need to track BOTH warehouse + tour to know true total inventory.

**Status**: 🟡 Deployed, debugging import issue (only 15/899 items showing)

**Key Features**:
- Multi-state inventory tracking (warehouse, transfer, tour_start, venue, tour)
- CSV import from Ambient Inks and Atvenue
- Master Inventory view showing all states
- Products and Inventory management pages
- Database diagnostics for troubleshooting

**Files**: See `PROJECT_STATUS.md` → "Merch Inventory System" section

### 2. Advancing System (10% Complete)
**Purpose**: AI-assisted tour advancing workflow with Master Tour API integration

**Problem Solved**: Advancing (gathering venue logistics) is repetitive and time-consuming. AI agents can draft emails, parse responses, and track progress, saving ~2 hours per show.

**Status**: 🔵 Planned and specified, ready for database migrations

**Key Features** (planned):
- Letta AI agents for email drafting and parsing
- Gmail integration for automated monitoring
- Master Tour API bidirectional sync
- Human-in-the-loop approval gates
- Confidence scoring on extracted data
- Progress tracking via checklists

**Files**: See `.claude/advancing-research.md`, `.claude/workflow.md`, `.claude/advancing-agent-spec.md`

---

## 🗂️ Documentation Structure

### Primary Documents (Read in Order)

1. **`.claude/PROJECT_STATUS.md`** ⭐ START HERE
   - Current state, blockers, next actions
   - Prioritized backlog (P0-P4)
   - Task details (what, why, who, how, estimate)
   - Handoff protocol for session end

2. **`.claude/claude.md`** (this file)
   - How agents should work with this project
   - Documentation hierarchy
   - Workflow and best practices

3. **`LOVABLE/instructions.md`**
   - Current tasks for Lovable agent specifically
   - Database migrations for advancing system
   - Diagnostic procedures for merch import

### Domain-Specific Documents

**Merch System**:
- `DEVELOPMENT_SUMMARY.md` - Overall architecture
- `IMPORT_GUIDE.md` - CSV import details
- `MERCH_SYSTEM_README.md` - System overview
- `WHAT_TO_EXPECT_AFTER_IMPORT.md` - User guide

**Advancing System**:
- `.claude/advancing-research.md` - Master Tour API capabilities
- `.claude/advancing-agent-spec.md` - Letta implementation details
- `.claude/workflow.md` - User-facing workflow
- `LOVABLE/instructions.md` - Database migrations

**Architecture**:
- `.claude/architecture.md` - Technical architecture details

---

## 🔄 Agent Workflow

### Session Start

```
1. Read `.claude/PROJECT_STATUS.md`
   └─ Check "Current Issues" for blockers
   └─ Review "In Progress" items
   └─ Identify highest priority unblocked task

2. Check Dependencies
   └─ Does this task depend on others?
   └─ Are dependencies met?
   └─ If blocked, pick next unblocked task

3. Review Task Details
   └─ What: Clear description
   └─ Why: Business justification
   └─ How: Implementation approach
   └─ Reference: Linked documentation

4. Execute Task
   └─ Follow documented approach
   └─ Test thoroughly
   └─ Commit with clear messages
```

### During Work

```
1. Update PROJECT_STATUS.md as you progress
   └─ Move task from "Planned" to "In Progress"
   └─ Update progress percentage if applicable
   └─ Add any new blockers discovered

2. Document Issues
   └─ Add to "Current Issues" if blocking
   └─ Include: Problem, Impact, Resolution path
   └─ Mark priority level (P0-P4)

3. Follow Coding Standards
   └─ Use TypeScript with strict types
   └─ Follow existing patterns in codebase
   └─ Add comments for complex logic
   └─ Write tests where applicable
```

### Session End

```
1. Update PROJECT_STATUS.md
   └─ Move completed tasks to "Completed" section
   └─ Update "In Progress" with current state
   └─ Update progress percentages
   └─ Add version history entry

2. Commit All Changes
   └─ Include PROJECT_STATUS.md in commit
   └─ Clear commit message describing what was done
   └─ Note any blockers or next steps

3. Push to Remote
   └─ Ensure changes are saved to GitHub
   └─ Other agents can pick up where you left off
```

---

## 🏗️ Project Architecture

### Tech Stack

**Frontend**:
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query (React Query) for state management
- shadcn/ui component library
- Tailwind CSS for styling

**Backend**:
- Supabase (PostgreSQL + Edge Functions)
- Row Level Security (RLS) for access control
- Real-time subscriptions for live updates

**Planned Integrations**:
- Master Tour API v5 (OAuth 1.0)
- Gmail API (OAuth 2.0)
- Letta framework for AI agents

### Key Directories

```
src/
├── pages/              # Full-page components
│   ├── Products.tsx
│   ├── Inventory.tsx
│   ├── MasterInventory.tsx
│   ├── ImportData.tsx
│   ├── DatabaseDiagnostics.tsx
│   └── advancing/      # Planned: Tours, Shows, Drafts, etc.
│
├── components/         # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AppSidebar.tsx
│   └── advancing/      # Planned: advancing-specific components
│
├── services/           # Business logic, API clients
│   ├── import/         # CSV importers for merch
│   └── masterTour/     # Planned: Master Tour API client
│
├── types/              # TypeScript type definitions
│   └── merch.ts
│
└── integrations/       # Third-party integrations
    └── supabase/       # Supabase client

supabase/
├── migrations/         # Database schema migrations
└── functions/          # Edge functions (server-side)
    └── import-ambient-inks/  # Server-side CSV import

.claude/                # Agent documentation
├── PROJECT_STATUS.md   # ⭐ PRIMARY - Current state & roadmap
├── claude.md          # This file - How to work with project
├── advancing-research.md
├── workflow.md
└── advancing-agent-spec.md

LOVABLE/                # Instructions for Lovable agent
└── instructions.md     # Current Lovable tasks
```

### Database Schema

**Merch System** (12 tables):
- `products`, `product_variants`, `product_identifiers`
- `product_pricing`, `product_metadata`
- `inventory_states`, `inventory_transactions`, `inventory_snapshots`
- `sales_orders`, `tour_sales`, `venue_night_totals`, `tour_blocks`
- Views: `master_inventory_view`, `product_pricing_view`

**Advancing System** (13 tables, planned):
- `tours`, `shows`, `show_contacts`
- `email_threads`, `email_messages`
- `agent_drafts`, `email_extractions`
- `agent_activity_log`, `agent_learning_data`
- `advancing_templates`, `advancing_checklists`
- `master_tour_sync_log`, `master_tour_cache`

See `LOVABLE/instructions.md` for complete schema SQL.

---

## 🎯 Priority System

### P0 - Critical (This Week)
**What**: Blocking issues or essential features needed immediately
**Who**: Whoever is available (Lovable agent, Claude, user)
**Impact**: Project stalled without these

### P1 - High (Next Week)
**What**: Important features for core functionality
**Who**: Any agent with appropriate skills
**Impact**: System incomplete without these

### P2 - Medium (Week 3-4)
**What**: Valuable features that enhance the system
**Who**: Any agent
**Impact**: Nice to have, improves UX/functionality

### P3-P4 - Low (Month 2+)
**What**: Future enhancements, optimizations
**Who**: Any agent when higher priorities done
**Impact**: Polish and advanced features

**Always work on highest priority unblocked task.**

---

## 💡 Best Practices for Agents

### Code Quality

1. **Type Safety**
   - Use TypeScript for all new code
   - Define interfaces in `src/types/`
   - Avoid `any` types unless absolutely necessary

2. **Component Structure**
   - Functional components with hooks
   - Extract complex logic to custom hooks
   - Keep components focused and single-purpose

3. **State Management**
   - Use TanStack Query for server state
   - Use React hooks (useState, useReducer) for UI state
   - Avoid prop drilling - use context when needed

4. **Error Handling**
   - Always handle API errors gracefully
   - Show user-friendly error messages
   - Log errors for debugging

5. **Performance**
   - Use React.memo for expensive components
   - Implement pagination for large lists
   - Lazy load routes and heavy components

### Database Operations

1. **Supabase Best Practices**
   - Use Row Level Security (RLS)
   - Batch operations when possible
   - Use `.maybeSingle()` instead of `.single()` to avoid errors
   - Always handle errors from database operations

2. **Migrations**
   - Never modify existing migrations
   - Create new migration files for schema changes
   - Test migrations locally before deploying

3. **Queries**
   - Use proper indexes (already in schema)
   - Select only needed columns
   - Use joins efficiently
   - Cache frequently accessed data

### Git Practices

1. **Commit Messages**
   - Clear, descriptive messages
   - Format: "Action: What was done"
   - Include context in body if complex

2. **Branch Strategy**
   - Work on feature branches
   - Name: `claude/feature-name-sessionid`
   - Merge to main when complete

3. **Before Pushing**
   - Update PROJECT_STATUS.md
   - Commit all changes
   - Verify tests pass (when we have them)

### Communication with User

1. **Be Clear and Concise**
   - User is a tour manager, not a developer
   - Explain what you did in plain language
   - Focus on value delivered, not technical details

2. **Ask When Unclear**
   - Don't guess at requirements
   - Clarify ambiguities before implementing
   - Propose options for user to choose

3. **Show Progress**
   - Update PROJECT_STATUS.md visibly
   - Mention completed tasks
   - Be honest about blockers

---

## 🔧 Common Tasks

### Starting a New Feature

```bash
# 1. Check PROJECT_STATUS.md for task details
cat .claude/PROJECT_STATUS.md

# 2. Create feature branch (if needed)
git checkout -b claude/feature-name-$(uuidgen | cut -d- -f1)

# 3. Create types (if database tables involved)
# Add to src/types/[domain].ts

# 4. Implement feature
# Follow existing patterns in codebase

# 5. Test in Lovable preview
# User will test, but do basic sanity checks

# 6. Update PROJECT_STATUS.md
# Move task to "Completed", update percentages

# 7. Commit and push
git add .
git commit -m "Descriptive message"
git push -u origin [branch-name]
```

### Fixing a Bug

```bash
# 1. Check if bug is in "Current Issues" in PROJECT_STATUS.md
# If not, add it with priority level

# 2. Reproduce the issue
# Understand the root cause

# 3. Fix and test
# Ensure fix doesn't break other functionality

# 4. Update PROJECT_STATUS.md
# Mark issue as resolved

# 5. Commit with clear message
git commit -m "Fix: [Issue description] - [Root cause]"
```

### Running Database Migrations

```bash
# Migrations are run in Supabase dashboard by Lovable agent
# See LOVABLE/instructions.md for SQL

# After migration:
# 1. Verify in Supabase dashboard
# 2. Update PROJECT_STATUS.md (migration complete)
# 3. Generate TypeScript types if new tables
# 4. Test that app still works
```

---

## 🚨 Troubleshooting

### "I don't know what to work on"
→ Read `.claude/PROJECT_STATUS.md` - start with highest priority unblocked task

### "Import showing only 15 items"
→ See `LOVABLE/instructions.md` - full diagnostic procedure
→ Lovable agent has already implemented server-side import to fix timeout

### "Types don't match database schema"
→ Check `supabase/migrations/` for actual schema
→ Update `src/types/` to match
→ Regenerate types if using Supabase CLI

### "Master Tour API not working"
→ Check if API keys are set in environment variables
→ Verify OAuth signature generation (see `.claude/advancing-agent-spec.md`)

### "Letta agents not deploying"
→ Check Docker setup
→ See `.claude/advancing-agent-spec.md` deployment section

### "Merge conflicts"
→ User merges main to feature branch
→ Resolve conflicts preserving both sets of changes where applicable

---

## 📊 Success Metrics

### Merch System
- ✅ 13 database tables with proper relationships
- ✅ CSV import from Ambient Inks and Atvenue
- ✅ UI pages for Products, Inventory, Master Inventory
- 🟡 All ~899 variants displaying correctly (currently 15)
- ⏳ User actively tracking inventory

### Advancing System
- ⏳ 13 database tables for advancing workflow
- ⏳ Master Tour API integration (read + write)
- ⏳ Letta AI agents drafting emails
- ⏳ Gmail integration monitoring inbox
- ⏳ User advancing 1+ shows via system
- ⏳ Time saved: 2 hours per show (target)

---

## 📞 Handoff Protocol

**Required at Session End**:

1. ✅ Update `.claude/PROJECT_STATUS.md`
   - Move completed tasks to "Completed"
   - Update "In Progress" section
   - Update progress percentages
   - Add version history entry

2. ✅ Commit all changes
   ```bash
   git add .
   git commit -m "Session summary: [What was done]

   Completed:
   - Task 1
   - Task 2

   In Progress:
   - Task 3 (65% complete)

   Blockers:
   - Issue X needs resolution before continuing

   Next: [Recommendation for next agent]"
   ```

3. ✅ Push to remote
   ```bash
   git push -u origin [branch-name]
   ```

4. ✅ Verify pushed successfully
   - Check GitHub to ensure commits visible

**Good Handoff Example**:
```
Session complete: Advanced merch system to 90%

Completed:
- Fixed import timeout with edge function (P0-1)
- Verified all 899 variants now display correctly
- Added data validation for malformed CSV rows
- Updated PROJECT_STATUS.md

In Progress:
- None

Blockers:
- None currently

Next Steps:
- User ready to merge PR
- Lovable agent can run advancing migrations (P0-2)
- Then ready to start P1-1 (TypeScript types for advancing)

All changes committed and pushed to claude/process-assets-01LJPzC9kt4yePD2C91pr3BV
```

---

## 🎓 Learning Resources

### Supabase
- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

### React + TypeScript
- [React Hooks](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)

### Master Tour API
- [API Docs](https://my.eventric.com/portal/apidocs)
- See `.claude/advancing-research.md` for analysis

### Letta
- [Letta Documentation](https://docs.letta.com)
- See `.claude/advancing-agent-spec.md` for implementation

---

## 🏁 Final Notes

**Remember**:
1. `.claude/PROJECT_STATUS.md` is the SINGLE SOURCE OF TRUTH
2. Update it frequently as you work
3. Always work on highest priority unblocked task
4. Commit and push regularly
5. Leave clear notes for next agent

**You are part of a relay race** - your job is to:
- Pick up where the last agent left off
- Make meaningful progress
- Document everything clearly
- Hand off smoothly to the next agent

**The project succeeds when agents work together seamlessly across sessions.**

Good luck! 🚀
