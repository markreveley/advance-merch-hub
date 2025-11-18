# Master Tour API Integration Research: Advancing Capabilities

**Date**: 2025-11-18
**Purpose**: Determine feasibility of creating/reading advancing data via Master Tour API
**Goal**: Achieve parity with Master Tour's advancing functionality

---

## Executive Summary

**API Access**: ✅ Full CRUD operations available for itinerary/schedule items
**Read Advances**: ⚠️ Partial - Can read event data, itinerary, notes, but no dedicated advancing endpoint
**Create Advances**: ⚠️ Partial - Can create itinerary items and update day notes, but no template system access
**Recommendation**: **Hybrid Approach** - Use API for core scheduling data, build custom advancing templates locally

---

## Master Tour API Overview

### Authentication
- **Method**: OAuth 1.0 signatures
- **Key Management**: Public/secret keypairs via `api/v5/getkeys` or API Key/Secret Page
- **Permission Model**: All requests made on behalf of key owner with validated permissions

### API Status
- Version: v5
- Documentation: "Under construction and may be incomplete"
- Rate Limits: None documented
- Webhooks: Not mentioned/unavailable

---

## Available API Endpoints

### Core Tour Management

#### Tours
```
GET  /api/v5/tours
     Returns: All accessible tours

GET  /api/v5/tour/{tourId}
     Params: numPastDays (optional, default=5)
     Returns: Tour object with Day records

GET  /api/v5/tour/{tourId}/crew
     Returns: Assigned personnel/crew collection
```

#### Days (Tour Dates)
```
GET  /api/v5/day/{dayId}
     Returns: Day object for specific date

GET  /api/v5/tour/{tourId}/summary/YYYY-MM-DD
     Returns: Itinerary summary for specific calendar date

PUT  /api/v5/day/{dayId}
     Body: { generalNotes, travelNotes, hotelNotes }
     Returns: Updated day object
```

#### Itinerary/Schedule Items (KEY FOR ADVANCING)
```
POST /api/v5/itinerary
     Body: {
       parentDayId,
       title,
       details,
       isConfirmed,
       isComplete,
       startDatetime,
       endDatetime,
       timePriority
     }
     Returns: Newly created schedule item

PUT  /api/v5/itinerary/{itemId}
     Body: All item fields
     Returns: Updated item

DELETE /api/v5/itinerary/{itemId}
     Returns: Confirmation
```

#### Events
```
GET  /api/v5/day/{dayId}/events
     Returns: Event collection for the day

GET  /api/v5/event/{eventId}/guestlist
     Returns: Guest list/requests

GET  /api/v5/event/{eventId}/setlist
     Returns: Set list for event
```

#### Hotels
```
GET  /api/v5/day/{dayId}/hotels
     Returns: Hotel collection for the day

GET  /api/v5/hotel/{hotelId}/contacts
     Returns: Hotel contacts

GET  /api/v5/hotel/{hotelId}/roomlist
     Returns: Room list
```

#### Contacts & Companies
```
GET  /api/v5/company/{companyId}/contacts
     Returns: Contact collection
```

#### Guest Lists
```
POST /api/v5/guestlist
     Body: {
       eventId,
       guestFirstName,
       guestLastName,
       contactEmail,
       quantity,
       instructions,
       paymentStatusCode,
       passTypeRequested,
       requestedBy
     }
     Returns: Created guest request

PUT  /api/v5/guestlist/{guestListId}
     Returns: Updated guest request
```

---

## How Master Tour Handles Advancing

### Advancing Workflow (from Eventric Support)

**Definition**: Advancing is the process of preparing events by organizing and updating key logistical details. It functions as a **customizable checklist** to gather all necessary information for a tour date.

### Key Features

1. **Two Work Modes**:
   - **Advance Tab**: Create custom templates using Event tab fields
   - **Event Tab**: Direct event editing
   - **Bidirectional Sync**: Changes in either tab sync automatically

2. **Template System**:
   - Create custom Advance templates
   - Choose which fields to include
   - Organize fields in any order
   - Save templates for reuse across events
   - Templates stored in Organization Settings

3. **Field Structure**:
   - Fields connect to **Venue info** (name, address, capacity, contacts)
   - Fields connect to **Schedule info** (tour date logistics)
   - Can add fields individually or entire sections at once

4. **Status Tracking**:
   - **Left Advance Sidebar**: Status of all Advances for selected Event
   - **Right Tour Dates Sidebar**: Status of all Advances for entire Tour
   - Visual indicators: In Progress, Completed, Needs Attention

### Typical Advancing Fields (Industry Standard)

Based on tour management practices, advancing typically includes:

**Venue Information**:
- Venue name, address, capacity
- Venue type (club, theater, arena, festival)
- Key contacts (production manager, house engineer, stage manager)
- Contact details (phone, email)
- Venue notes/restrictions

**Schedule/Timing**:
- Load-in time
- Sound check time
- Doors time
- Show time / Set time
- Curfew
- Load-out time

**Technical Requirements**:
- Stage dimensions
- Power requirements
- Backline availability
- PA system specs
- Lighting capabilities
- Stage plot requirements
- Input list requirements

**Hospitality**:
- Dressing rooms
- Catering/buyout
- Guest list allocation
- Parking/bus parking
- WiFi access

**Financial**:
- Guarantee amount
- Settlement details
- Deposit status
- Payment method

**Logistics**:
- Hotel information
- Transportation details
- Crew call times
- Local crew requirements

---

## API Capabilities Analysis

### ✅ What We CAN Do via API

#### Read Operations
1. **Fetch all tours** - Get complete tour list
2. **Fetch tour dates** - Get day-by-day schedule with date filtering
3. **Read schedule items** - Access all itinerary items (load in, sound check, etc.)
4. **Access event details** - Get event information for each show
5. **Retrieve hotel info** - Get hotel details and room lists
6. **Get crew assignments** - View personnel assigned to tour
7. **Read day notes** - Access general, travel, and hotel notes
8. **Fetch guest lists** - View guest list requests
9. **Get set lists** - Access performance set lists
10. **Read contacts** - Get venue and company contact information

#### Write Operations
1. **Create schedule items** - Add new itinerary entries with:
   - Title (e.g., "Load In", "Sound Check", "Doors")
   - Details (description/notes)
   - Start/end datetime
   - Confirmation status
   - Completion status
   - Time priority
2. **Update schedule items** - Modify existing itinerary
3. **Delete schedule items** - Remove itinerary entries
4. **Update day notes** - Add/edit general, travel, hotel notes
5. **Manage guest lists** - Add and update guest requests

### ❌ What We CANNOT Do via API

1. **Access Advance Templates** - No endpoint to read/write custom templates
2. **Direct Advancing Endpoint** - No dedicated API for advancing workflow
3. **Custom Fields** - Cannot access organization-specific custom fields
4. **Advance Status Tracking** - No API for "In Progress" / "Completed" status
5. **Venue Tech Packs** - No access to venue technical specifications
6. **Template Assignments** - Cannot programmatically assign templates to events
7. **Webhooks** - Cannot receive real-time updates from Master Tour

### ⚠️ Partial Capabilities

1. **Venue Information**:
   - ✅ Can read via day/event endpoints
   - ❌ Cannot write venue details via API (if they're even in the API response)
   - **Workaround**: Store venue info locally, sync what's available via events

2. **Advancing Templates**:
   - ❌ Cannot access Master Tour templates
   - ✅ Can replicate functionality by creating itinerary items
   - **Workaround**: Build our own template system that maps to itinerary items

3. **Status Tracking**:
   - ✅ Can use `isConfirmed` and `isComplete` flags on itinerary items
   - ❌ Cannot access Master Tour's advancing-specific status system
   - **Workaround**: Use itinerary flags + local status tracking

---

## Data Structures (from API Docs)

### Itinerary Item Object
```json
{
  "id": "string",
  "parentDayId": "string (UUID)",
  "title": "string (e.g., 'Load In', 'Sound Check')",
  "details": "string (notes/description)",
  "isConfirmed": "boolean",
  "isComplete": "boolean",
  "startDatetime": "ISO 8601 datetime",
  "endDatetime": "ISO 8601 datetime",
  "timePriority": "integer (display order)",
  "travelDetail": "object (for travel items only)"
}
```

### Day Object
```json
{
  "id": "string (UUID)",
  "date": "YYYY-MM-DD",
  "generalNotes": "string",
  "travelNotes": "string",
  "hotelNotes": "string",
  "events": "array (event objects)",
  "hotels": "array (hotel objects)"
}
```

### Response Format
```json
{
  "success": "boolean",
  "message": "string",
  "data": "object or array"
}
```

---

## Proposed Approach: Hybrid Architecture

### Strategy Overview

Build a **hybrid system** that:
1. Uses Master Tour API for core scheduling data (tours, days, events, itinerary)
2. Builds custom advancing templates and workflow locally
3. Syncs bidirectionally where possible
4. Stores advancing-specific data locally when API doesn't support it

### Architecture Components

#### 1. API Integration Layer
```
src/services/masterTour/
├── auth/
│   ├── oauthClient.ts          # OAuth 1.0 signature generation
│   └── keyManager.ts            # Store/manage API keys
├── api/
│   ├── tours.ts                 # GET tours, tour details
│   ├── days.ts                  # GET/PUT day data, summaries
│   ├── itinerary.ts             # POST/PUT/DELETE schedule items
│   ├── events.ts                # GET events, guest lists, set lists
│   ├── hotels.ts                # GET hotels, contacts, room lists
│   └── contacts.ts              # GET company contacts
└── sync/
    ├── syncEngine.ts            # Bidirectional sync orchestration
    └── conflictResolver.ts      # Handle sync conflicts
```

#### 2. Local Advancing System
```
src/features/advancing/
├── templates/
│   ├── AdvanceTemplate.tsx      # Template editor UI
│   ├── templateSchema.ts        # Template field definitions
│   └── defaultTemplates.ts      # Industry-standard templates
├── drafts/
│   ├── AdvanceDraft.tsx         # Working on an advance
│   ├── draftStatus.ts           # Track completion status
│   └── draftHistory.ts          # Version history
├── fields/
│   ├── FieldTypes.tsx           # Custom field components
│   └── fieldMapping.ts          # Map to itinerary items
└── export/
    ├── pdfGenerator.ts          # Export to PDF
    └── emailComposer.ts         # Send advances via email
```

#### 3. Database Schema (Supabase)
```sql
-- Advancing Templates
CREATE TABLE advance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  field_definitions JSONB NOT NULL,  -- Array of field configs
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advancing Drafts
CREATE TABLE advance_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT NOT NULL,             -- Master Tour tour ID
  day_id TEXT NOT NULL,              -- Master Tour day ID
  event_id TEXT,                     -- Master Tour event ID (if applicable)
  template_id UUID REFERENCES advance_templates(id),
  field_values JSONB NOT NULL,       -- Actual advancing data
  status TEXT DEFAULT 'draft',       -- draft, in_progress, completed
  last_synced_at TIMESTAMPTZ,        -- Last sync with Master Tour
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync mapping between local drafts and Master Tour itinerary items
CREATE TABLE advance_itinerary_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_draft_id UUID REFERENCES advance_drafts(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,           -- Which advance field (e.g., "loadInTime")
  itinerary_item_id TEXT NOT NULL,   -- Master Tour itinerary item ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache Master Tour data locally
CREATE TABLE master_tour_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,       -- 'tour', 'day', 'event', 'itinerary'
  resource_id TEXT NOT NULL,         -- Master Tour ID
  data JSONB NOT NULL,               -- Cached data
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_type, resource_id)
);
```

---

## Detailed Implementation Plan

### Phase 1: API Foundation (Week 1)

**Goals**: Establish connection to Master Tour API, basic read operations

**Tasks**:
1. **OAuth 1.0 Implementation**
   - Build OAuth signature generator
   - Create key management system
   - Store keys securely (encrypted in Supabase, env vars)
   - Test authentication with `getkeys` endpoint

2. **API Client Layer**
   - Create base HTTP client with OAuth signing
   - Implement response parsing (success/message/data structure)
   - Add error handling and retry logic
   - Build TypeScript types from API responses

3. **Basic Read Operations**
   - Fetch tours list
   - Fetch tour details with dates
   - Fetch day summaries
   - Fetch events for day
   - Display in UI (simple list view)

4. **Caching Strategy**
   - Implement `master_tour_cache` table
   - Cache tour/day/event data with TTL
   - Reduce API calls, improve performance

**Deliverables**:
- Working OAuth authentication
- API client with tours, days, events endpoints
- Simple UI showing tours and dates from Master Tour
- Cached data with refresh mechanism

---

### Phase 2: Itinerary Integration (Week 2)

**Goals**: Read and write schedule items, map to advancing concepts

**Tasks**:
1. **Read Itinerary Items**
   - Fetch schedule items for each day
   - Parse and categorize items (load in, sound check, doors, show)
   - Display in timeline view

2. **Create Itinerary Items from Advancing**
   - Map advancing fields to itinerary items:
     - `loadInTime` → Itinerary item "Load In"
     - `soundCheckTime` → Itinerary item "Sound Check"
     - `doorsTime` → Itinerary item "Doors"
     - `showTime` → Itinerary item "Show Time"
   - Build create/update/delete functions
   - Handle confirmation status (`isConfirmed`)

3. **Day Notes Integration**
   - Display general/travel/hotel notes
   - Allow editing and syncing back to Master Tour
   - Use for advancing notes that don't fit itinerary items

4. **Bidirectional Sync Logic**
   - Detect changes in Master Tour (poll or manual refresh)
   - Detect local changes in advancing drafts
   - Sync schedule items both ways
   - Handle conflicts (last-write-wins or prompt user)

**Deliverables**:
- Read/write itinerary items via API
- Map advancing times to schedule items
- Sync day notes bidirectionally
- Conflict resolution UI

---

### Phase 3: Advancing Templates (Week 3)

**Goals**: Build local template system for advancing workflow

**Tasks**:
1. **Template Schema Design**
   - Define field types: text, datetime, number, checkbox, select, textarea
   - Group fields into sections (Venue, Schedule, Technical, Hospitality, etc.)
   - Support custom fields
   - Validation rules

2. **Default Templates**
   - Create industry-standard templates:
     - **Basic Club Show**: Load in, sound check, doors, show, essential contacts
     - **Theater/PAC**: More formal, detailed technical requirements
     - **Festival**: Multi-artist coordination, site-specific logistics
     - **Arena/Amphitheater**: Large-scale production, extended schedules
   - Make templates editable

3. **Template Editor UI**
   - Drag-and-drop field ordering
   - Add/remove fields
   - Section management
   - Preview template
   - Save as new template

4. **Template Assignment**
   - Assign template to tour (default for all dates)
   - Assign template to specific date
   - Override template for individual show

**Deliverables**:
- Template data model and schema
- 4+ default templates
- Template editor UI
- Template assignment workflow

---

### Phase 4: Advancing Drafts (Week 4)

**Goals**: Working on individual show advances, status tracking

**Tasks**:
1. **Draft Creation**
   - Select tour date
   - Choose template
   - Pre-populate with data from Master Tour:
     - Venue info from event
     - Existing schedule items from itinerary
     - Hotel info from day
     - Contacts from venue/company
   - Create draft in `advance_drafts` table

2. **Draft Editing**
   - Render template fields as form
   - Real-time saving (debounced)
   - Field validation
   - Mark fields as required/optional
   - Add notes/attachments per section

3. **Status Management**
   - Draft → In Progress → Completed
   - Track completion percentage (fields filled / total fields)
   - Visual progress indicators
   - Filter drafts by status

4. **Draft List View**
   - Show all advances for tour
   - Status badges (Draft, In Progress, Completed)
   - Quick actions (edit, duplicate, delete)
   - Search and filter

**Deliverables**:
- Advance draft creation workflow
- Draft editor with template rendering
- Status tracking system
- Draft list/management UI

---

### Phase 5: Sync & Export (Week 5)

**Goals**: Push data to Master Tour, export for sharing

**Tasks**:
1. **Sync to Master Tour**
   - Push schedule times as itinerary items
   - Update day notes with advancing summary
   - Create mapping in `advance_itinerary_mapping`
   - Handle updates (update existing itinerary items)
   - Show sync status (last synced, pending changes)

2. **Sync from Master Tour**
   - Pull latest itinerary items
   - Update draft fields based on changes
   - Detect conflicts, prompt user
   - Merge non-conflicting changes automatically

3. **Export Features**
   - **PDF Export**: Professional advancing PDF
     - Formatted with sections
     - Include all filled fields
     - Venue/contact info prominent
     - Schedule timeline visual
   - **Email**: Send advance to contacts
     - Select recipients
     - Custom message
     - Attach PDF
   - **Print**: Print-friendly version

4. **Sharing & Collaboration**
   - Share draft link (read-only)
   - Comments on fields (internal notes)
   - Activity log (who changed what when)

**Deliverables**:
- Bidirectional sync engine
- Conflict resolution UI
- PDF export with professional formatting
- Email integration
- Sharing capabilities

---

### Phase 6: Advanced Features (Week 6+)

**Goals**: Achieve parity with Master Tour, add unique value

**Tasks**:
1. **Guest List Integration**
   - Pull guest lists from Master Tour
   - Display in advancing draft
   - Add/update guest requests via API
   - Track comp allocation

2. **Hotel/Travel Integration**
   - Display hotel info from Master Tour
   - Room list management
   - Travel notes integration

3. **Set List Integration**
   - Pull set lists from Master Tour
   - Display in advancing context
   - Useful for production planning

4. **Crew Integration**
   - Show crew assignments from Master Tour
   - Crew call times in schedule
   - Local crew notes

5. **Venue Database** (Unique Value)
   - Build local venue library
   - Store venue tech specs not in Master Tour
   - Venue history/notes from past shows
   - Stage plots, input lists storage

6. **Advancing Analytics** (Unique Value)
   - Track time-to-complete for advances
   - Identify bottlenecks
   - Template effectiveness metrics
   - Common issues/notes analysis

7. **Mobile-Friendly UI**
   - Responsive advancing editor
   - Quick updates on phone
   - Offline mode with sync

**Deliverables**:
- Guest list, hotel, set list, crew integration
- Local venue database
- Analytics dashboard
- Mobile-optimized UI

---

## Technical Considerations

### OAuth 1.0 Implementation

**Challenge**: OAuth 1.0 is older, requires signature generation

**Solution**:
```typescript
// Use crypto-js or similar for HMAC-SHA1 signing
import CryptoJS from 'crypto-js';

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
) {
  // 1. Collect parameters (OAuth + query params)
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...params
  };

  // 2. Create signature base string
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${key}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // 3. Generate signature
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = CryptoJS.HmacSHA1(signatureBase, signingKey).toString(CryptoJS.enc.Base64);

  return { ...oauthParams, oauth_signature: signature };
}
```

### Sync Strategy

**Approach**: Optimistic UI with background sync

1. **User makes change**: Update local DB immediately
2. **Queue sync**: Add to sync queue
3. **Background sync**: Process queue, call API
4. **Handle conflicts**: If API returns error/conflict, prompt user
5. **Poll for changes**: Periodically fetch from Master Tour, merge changes

**Conflict Resolution**:
- **Last-write-wins**: Simpler, can lose data
- **User prompted**: Safer, show diff, let user choose
- **Field-level merge**: Complex but best UX

### Performance

**Caching Strategy**:
- Cache tours for 1 hour
- Cache days for 30 minutes
- Cache itinerary for 5 minutes
- Invalidate on write

**Pagination**:
- Master Tour API doesn't mention pagination
- Assume full data sets for now
- Implement client-side filtering/pagination

### Error Handling

**API Failures**:
- Retry with exponential backoff
- Show user-friendly error messages
- Queue operations for retry
- Offline mode: Work locally, sync when online

---

## Comparison: Master Tour vs Our App

| Feature | Master Tour | Our App | Advantage |
|---------|-------------|---------|-----------|
| **Advancing Templates** | ✅ Full system | ✅ Custom built | **Parity** |
| **Itinerary Sync** | N/A (native) | ✅ Via API | Master Tour |
| **Status Tracking** | ✅ Built-in | ✅ Custom | **Parity** |
| **Custom Fields** | ✅ Yes | ✅ Yes | **Parity** |
| **Mobile Access** | ✅ Yes | ✅ Responsive | **Parity** |
| **Merch Integration** | ❌ No | ✅ Built-in | **Our App** |
| **Venue Database** | ❌ Limited | ✅ Comprehensive | **Our App** |
| **Analytics** | ❌ No | ✅ Planned | **Our App** |
| **PDF Export** | ✅ Yes | ✅ Planned | **Parity** |
| **Email Integration** | ✅ Yes | ✅ Planned | **Parity** |
| **Offline Mode** | ❌ No | ✅ Planned | **Our App** |
| **Version History** | ❓ Unknown | ✅ Planned | **Our App** |

---

## Risks and Mitigations

### Risk 1: API Limitations
**Issue**: API doesn't expose advancing templates or custom fields
**Mitigation**: Build own template system, map to itinerary items where possible
**Impact**: Medium - Reduces seamless integration but still functional

### Risk 2: API Changes
**Issue**: v5 API is "under construction", may change
**Mitigation**: Version API client, abstract API calls behind interface
**Impact**: Low - Can adapt to changes

### Risk 3: Sync Conflicts
**Issue**: User edits in both Master Tour and our app simultaneously
**Mitigation**: Implement conflict resolution UI, prefer Master Tour as source of truth
**Impact**: Low - Rare occurrence, manageable

### Risk 4: OAuth Complexity
**Issue**: OAuth 1.0 is complex, signature generation error-prone
**Mitigation**: Use tested libraries, comprehensive error handling
**Impact**: Medium - Initial setup challenge only

### Risk 5: Performance
**Issue**: Large tours with many dates could slow down
**Mitigation**: Pagination, lazy loading, caching, background sync
**Impact**: Low - Optimizations available

---

## Recommended Phased Rollout

### MVP (Weeks 1-3): Read-Only Integration
- Connect to Master Tour API (OAuth)
- Display tours, dates, events
- Show existing itinerary items
- Basic template system (local only)
- No sync, just viewing

**Value**: Users can see Master Tour data in our app alongside merch

### Version 1.0 (Weeks 4-6): Full Advancing
- Create advancing drafts from templates
- Sync schedule items to Master Tour
- Status tracking
- PDF export
- Email integration

**Value**: Full advancing workflow, bidirectional sync with Master Tour

### Version 2.0 (Weeks 7-10): Enhanced Features
- Guest list integration
- Hotel/travel integration
- Venue database
- Analytics
- Mobile optimization
- Offline mode

**Value**: Surpass Master Tour with merch integration and advanced features

---

## Conclusion

**Feasibility**: ✅ **Highly Feasible**

The Master Tour API provides sufficient endpoints to build a robust advancing system:
- ✅ Can READ all necessary data (tours, days, events, itinerary)
- ✅ Can WRITE schedule items (itinerary POST/PUT/DELETE)
- ✅ Can UPDATE day notes
- ⚠️ Cannot access native advancing templates (build our own)

**Recommended Approach**: **Hybrid System**
1. Use Master Tour API for core scheduling data
2. Build custom advancing template system locally
3. Map advancing fields to itinerary items for sync
4. Store advancing-specific data in local Supabase
5. Provide unique value through merch integration, venue database, analytics

**Parity Achievement**: **80-90%**
- Core advancing workflow: 100% achievable
- Template system: 100% (custom implementation)
- Sync with Master Tour: 80% (limited by API)
- Advanced features: 100%+ (we can exceed MT with custom features)

**Unique Value Proposition**:
- **Integrated merch tracking** alongside advancing
- **Comprehensive venue database** with historical data
- **Analytics and insights** on advancing efficiency
- **Offline mode** for work anywhere
- **Version history** and collaboration features

**Timeline**: 10-12 weeks for full feature parity + unique features

**Next Steps**:
1. Obtain Master Tour API keys (test and production)
2. Implement OAuth 1.0 authentication
3. Build basic API client for tours/days/events
4. Design database schema for advancing drafts
5. Create MVP template system
6. Begin phased development per plan above
