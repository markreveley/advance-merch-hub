# Advancing Merch App - Architecture Documentation

## Overview

The Advancing Merch App is a dual-purpose system for managing a music act's merchandise and tour advancing workflows. It integrates data from merchandise management companies and tour reporting platforms to provide centralized tracking and AI-assisted advancing documentation.

## Core Functions

### 1. Merch Management
- Track inventory from merch management companies
- Monitor sales via Ambient Inks reports
- Manage product catalog and stock levels
- Analyze sales data and payouts

### 2. Advancing
- Manage tour schedules and shows
- Generate AI-powered advancing drafts
- Track advancing status per show
- Integrate with Master Tour API for document sync

## Database Schema

### Products Table
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

### Advancing Drafts Table
**Purpose:** AI-generated and manual advancing documents

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| show_id | uuid | Foreign key to shows |
| draft_type | text | Document type (rider/hospitality/tech/etc) |
| content | text | Document content |
| ai_generated | boolean | Whether AI created this draft |
| version | integer | Document version number |
| status | text | Draft status (draft/review/approved/sent) |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

**Constraints:**
- Foreign key: `show_id` references `shows(id)` CASCADE DELETE

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

### 4. AI Advancing Generator (Lovable AI)
- **Purpose:** Generate advancing documents using AI
- **Models:** Google Gemini 2.5 Flash (default)
- **Input:** Show details, venue info, tour requirements
- **Output:** Formatted advancing drafts (riders, hospitality, tech specs)
- **Storage:** Advancing Drafts table

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
