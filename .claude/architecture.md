# Advancing Merch App - Architecture Documentation

**Last Updated**: 2025-11-19

## Overview

The Advancing Merch App is a dual-purpose system for managing a music act's merchandise and tour advancing workflows. It integrates data from merchandise management companies and tour reporting platforms to provide centralized tracking and AI-assisted advancing documentation.

## 📚 Complete Documentation

This is a high-level overview. For detailed specifications, see:

- **`.claude/PROJECT_STATUS.md`** - Current state, priorities, and roadmap
- **`.claude/workflow.md`** - Complete advancing workflow (5 phases)
- **`.claude/advancing-agent-spec.md`** - Letta agent technical implementation
- **`.claude/advancing-research.md`** - Master Tour API documentation
- **`LOVABLE/instructions.md`** - Database migration instructions

## Core Functions

### 1. Merch Management
- Track inventory from merch management companies
- Monitor sales via Ambient Inks reports
- Manage product catalog and stock levels
- Analyze sales data and payouts

### 2. Advancing (AI-Assisted Workflow)
- Manage tour schedules and shows
- **Letta AI agents** monitor email threads and draft advancing emails
- Human-in-the-loop: TM approves all agent actions
- Bidirectional sync with Master Tour API
- Track advancing progress with checklists

**Advancing Loop** (see `.claude/workflow.md` for details):
1. Show confirmed → Created in app/Master Tour
2. AI agent drafts initial advancing email → TM approves → Sent
3. Agent monitors Gmail inbox for venue responses
4. Agent parses response → Extracts data → TM reviews
5. Data synced to app & Master Tour → Checklist updated
6. Agent drafts follow-up → Loop continues until complete

**Agent Architecture** (see `.claude/advancing-agent-spec.md`):
- **Framework**: Letta (letta.com) for stateful LLM agents
- **4 Specialized Agents**: Coordinator, Draft Generator, Email Parser, Sync Manager
- **Persistent Memory**: Each show has dedicated agent context
- **Learning**: Agents improve from TM feedback and venue patterns

## Database Schema

**Note**: Full schema with all advancing tables documented in `.claude/advancing-agent-spec.md` and migration files in `supabase/migrations/`.

### Merch System Tables

#### Products Table
**Purpose:** Central catalog of all merchandise items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | bigint | External product ID (from merch company) |
| sku | text | Stock keeping unit (unique) |
| name | text | Product name |
| price | decimal(10,2) | Base price |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**Constraints:**
- Unique constraint on `product_id`
- Unique constraint on `sku`

### Inventory Table
**Purpose:** Track current stock levels by location

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | uuid | Foreign key to products |
| quantity | integer | Current stock quantity |
| location | text | Storage location |
| updated_at | timestamptz | Last inventory update |

**Constraints:**
- Foreign key: `product_id` references `products(id)` CASCADE DELETE
- Unique constraint on (`product_id`, `location`)

### Sales Orders Table
**Purpose:** Store sales transaction data from Ambient Inks

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_number | bigint | External order number |
| order_date | timestamptz | Date of sale |
| product_id | uuid | Foreign key to products |
| quantity | integer | Units sold |
| gross_sales | decimal(10,2) | Total sale amount |
| discounts | decimal(10,2) | Applied discounts |
| net_sales | decimal(10,2) | After discounts |
| commission | decimal(10,2) | Platform commission |
| deduction | decimal(10,2) | Other deductions |
| payout | decimal(10,2) | Final payout amount |
| created_at | timestamptz | Record creation |

**Constraints:**
- Foreign key: `product_id` references `products(id)` SET NULL on delete

### Tour Reports Table
**Purpose:** Store merch sales reports from atvenu.com

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| show_id | uuid | Link to specific show (optional) |
| report_date | date | Date of report |
| venue | text | Venue name |
| location | text | Venue location |
| sales_data | jsonb | Flexible sales data structure |
| notes | text | Additional notes |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

### Tours Table
**Purpose:** Organize shows into tour cycles

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Tour name |
| start_date | date | Tour start date |
| end_date | date | Tour end date |
| status | text | Tour status (planning/active/completed) |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

### Shows Table
**Purpose:** Individual tour dates and venue information

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tour_id | uuid | Foreign key to tours |
| show_date | date | Performance date |
| venue | text | Venue name |
| city | text | City |
| state | text | State/province |
| country | text | Country (default: USA) |
| master_tour_id | text | External ID from Master Tour |
| advancing_status | text | Status (not_started/in_progress/completed) |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

**Constraints:**
- Foreign key: `tour_id` references `tours(id)` CASCADE DELETE

### Advancing System Tables (13 total)

**Core Tables:**
- `advancing_drafts` - Manually created docs (rider, hospitality, tech specs)
- `agent_drafts` - AI-generated email drafts from Letta agents
- `email_threads` - Gmail thread tracking per show
- `email_messages` - Individual messages in threads
- `email_extractions` - AI-parsed data from venue responses

**Progress Tracking:**
- `advancing_checklists` - Task items per show
- `advancing_templates` - Email/document templates

**AI Learning:**
- `agent_activity_log` - All agent actions
- `agent_learning_data` - Venue patterns and preferences

**Master Tour Sync:**
- `master_tour_sync_log` - Sync operation history
- `master_tour_cache` - API response caching

**Additional Fields Added to Existing Tables:**
- `shows` table: `stage_info`, `capacity`, `doors_time`, `show_time`, `load_in_time`, `settlement_currency`, `merch_split_percentage`, `notes`, `master_tour_sync_status`, `last_synced_at`, `primary_thread_id`
- `tours` table: `master_tour_id`, `artist`, `tour_manager_name`, `tour_manager_email`, `tour_manager_phone`

See `supabase/migrations/20251119001727_*.sql` for complete schema.

## Database Triggers

### Updated At Trigger
All tables with `updated_at` columns have triggers that automatically update the timestamp on row modification.

**Function:** `public.update_updated_at_column()`
- Language: plpgsql
- Security: DEFINER
- Search path: public

## Row Level Security (RLS)

All tables have RLS enabled with the following policy:
- **Policy:** "Allow all for authenticated users"
- **Access:** All operations (SELECT, INSERT, UPDATE, DELETE)
- **Scope:** Authenticated users only

## Planned Integrations

### 1. Ambient Inks Integration
- **Source:** CSV reports from Ambient Inks merch management
- **Data Flow:** CSV → Parse → Products + Sales Orders tables
- **Frequency:** As needed (manual imports initially)

### 2. AtVenu Integration
- **Source:** Tour reports from atvenu.com
- **Data Flow:** API/CSV → Tour Reports table
- **Frequency:** Per show basis

### 3. Master Tour API Integration
- **Purpose:** 
  - Sync show information
  - Push AI-generated advancing drafts
  - Update advancing status
- **Data Flow:** Bidirectional sync between Shows/Advancing Drafts and Master Tour
- **Implementation:** Edge function for API communication

### 4. Letta AI Agents (Advancing Automation)
- **Purpose:** Automate advancing email workflow while keeping TM in control
- **Framework:** Letta (letta.com) - stateful LLM agents
- **Agents:**
  - **Coordinator**: Orchestrates all advancing for all shows
  - **Draft Generator**: Creates personalized advancing emails
  - **Email Parser**: Extracts structured data from venue responses
  - **Sync Manager**: Handles Master Tour API bidirectional sync
- **Human-in-the-Loop:** TM must approve:
  - All outgoing emails before sending
  - All extracted data before applying to show
  - All conflict resolutions
- **Learning:** Agents improve by:
  - Observing TM edits to drafts
  - Tracking venue response patterns
  - Building venue preference database
- **Storage:**
  - Agent drafts → `agent_drafts` table
  - Extracted data → `email_extractions` table
  - Agent actions → `agent_activity_log` table
  - Learning data → `agent_learning_data` table

**See `.claude/advancing-agent-spec.md` for complete implementation details.**

## Security Considerations

- All database functions use `SECURITY DEFINER` with explicit `search_path = public`
- RLS policies restrict access to authenticated users only
- No public data exposure
- Master Tour API credentials stored in Lovable Cloud secrets

## Future Enhancements

1. **Authentication System:** User login/signup for team access
2. **CSV Import Tool:** Automated parsing of Ambient Inks reports
3. **Dashboard:** Analytics for sales trends, inventory levels
4. **Master Tour Sync:** Real-time bidirectional sync with Master Tour
5. **AI Templates:** Customizable advancing document templates
6. **Version Control:** Track changes to advancing drafts over time
7. **Approval Workflow:** Multi-stage review process for advancing docs
