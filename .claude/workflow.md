# Advancing Workflow: AI-Assisted Tour Date Management

**Date**: 2025-11-18
**Purpose**: Define the complete advancing workflow with AI agent assistance
**Agent Framework**: Letta (letta.com)

---

## Workflow Overview

The advancing process is a continuous loop of information gathering, communication, and synchronization between the tour manager, venue contacts, and multiple systems (our app, Master Tour, email). AI agents automate the repetitive parts while keeping humans in control of critical decisions.

---

## Complete Workflow Loop

### Phase 1: Show Confirmation & Creation

#### Step 1.1: Contract Received
**Trigger**: Tour manager receives signed contract from booking agent/venue

**Contract Contains**:
- Show date and time
- Venue name and address
- Venue contact name(s) and email(s)
- Guarantee/financial terms
- Basic requirements (load-in time, doors, show time)
- Technical specs (if provided)

**Action**: TM has contract ready for data entry

---

#### Step 1.2: Show Creation (Bidirectional Options)

**Option A: Create in Master Tour First**
```
1. TM creates show in Master Tour web app
2. Enters: Date, Venue, Contact, Basic Times
3. In our app, TM clicks "Sync from Master Tour"
4. App fetches new show via MT API
5. Show appears in our app's Shows list
6. Status: "Draft - Awaiting Advance"
```

**Option B: Create in Our App First**
```
1. TM creates show in our app
2. Enters: Date, Venue, Contact, Basic Times
3. App auto-syncs to Master Tour via API
4. Show created in MT with initial data
5. Status: "Draft - Awaiting Advance"
```

**Data Model** (Show Object):
```typescript
{
  id: UUID,
  tourId: string,                    // Master Tour tour ID
  masterTourDayId: string,           // Master Tour day ID
  masterTourEventId: string,         // Master Tour event ID
  date: Date,
  venueName: string,
  venueAddress: string,
  venueCity: string,
  venueState: string,
  venueCapacity: number,
  primaryContact: {
    name: string,
    email: string,
    phone: string,
    role: string                     // "Production Manager", "Stage Manager", etc.
  },
  additionalContacts: Contact[],
  schedule: {
    loadIn: DateTime,
    soundCheck: DateTime,
    doors: DateTime,
    showTime: DateTime,
    curfew: DateTime,
    loadOut: DateTime
  },
  technical: {
    stageSize: string,
    powerRequirements: string,
    backlineProvided: boolean,
    paSystemSpecs: string,
    notes: string
  },
  hospitality: {
    dressingRooms: number,
    buyoutAmount: number,
    guestListAllocation: number,
    parkingSpaces: number,
    notes: string
  },
  advancingStatus: "draft" | "initiated" | "in_progress" | "completed",
  lastSyncedAt: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

### Phase 2: Initial Advancing Email (Agent-Generated)

#### Step 2.1: Agent Creates Draft Email

**Trigger**: TM clicks "Start Advancing" on show in our app

**Agent Process**:
```
1. Retrieve show object from database
2. Identify what information is KNOWN (from contract)
3. Identify what information is NEEDED (missing fields)
4. Load advancing email template (customizable per tour/artist)
5. Generate personalized email:
   - Greeting with venue contact name
   - Confirm known details ("As confirmed...")
   - Request missing details with specific questions
   - Set expectations for response timeline
   - Professional closing
6. Attach rider PDF (from tour settings)
7. Create draft in Gmail via API
8. Store draft metadata in database
9. Update show status to "Draft Pending Approval"
10. Trigger UI notification for TM
```

**Email Template Structure**:
```
Subject: Advancing [Artist Name] - [Venue Name] - [Date]

Hi [Contact Name],

We're looking forward to [Artist Name]'s show at [Venue Name] on [Date]!

I wanted to reach out to confirm a few details and gather some additional
information to ensure everything runs smoothly.

CONFIRMED DETAILS:
✓ Date: [Date]
✓ Load In: [Time] (if known)
✓ Doors: [Time] (if known)
✓ Show Time: [Time] (if known)

QUESTIONS FOR YOU:
[Agent generates specific questions based on missing fields]
1. Can you confirm the load-in time and location?
2. What time would work for a sound check?
3. How many dressing rooms are available?
4. What's the stage size and power availability?
[... more questions as needed ...]

ATTACHMENTS:
I've attached our technical rider for your review. Please let me know if
you have any questions or concerns about the requirements.

Looking forward to hearing from you!

Best,
[Tour Manager Name]
[Contact Info]
```

**Agent Draft Metadata** (stored in DB):
```typescript
{
  id: UUID,
  showId: UUID,
  gmailDraftId: string,              // Gmail draft ID
  subject: string,
  body: string,
  recipients: string[],
  ccRecipients: string[],
  attachments: string[],             // File paths/URLs
  questionsAsked: string[],          // Structured list of what was asked
  fieldsRequested: string[],         // Show object fields requested
  status: "pending_review" | "approved" | "sent",
  createdAt: DateTime,
  reviewedAt?: DateTime,
  sentAt?: DateTime,
  agentConfidence: number            // 0-1, how confident in draft quality
}
```

---

#### Step 2.2: TM Reviews & Sends Draft

**UI Alert**:
- Toast notification: "Advancing draft ready for [Venue Name]"
- Badge on Shows page showing pending drafts count
- Draft appears in "Pending Approvals" queue

**TM Actions in UI**:
```
1. Navigate to "Pending Approvals" or click notification
2. Review generated draft:
   - See original context (what agent knows)
   - See what agent is asking for
   - Preview email as it will appear
3. Options:
   a. APPROVE & SEND: Agent sends via Gmail, updates status
   b. EDIT: Opens Gmail draft for manual editing before send
   c. REJECT: Provide feedback, agent regenerates
   d. SCHEDULE: Set send time for later
```

**On Send**:
```
1. Email sent via Gmail
2. Gmail auto-labels email: "Advancing/[Tour Name]"
3. Database updated:
   - Draft status: "sent"
   - Show status: "Advancing In Progress"
   - Email thread tracked
4. Agent begins monitoring for response
```

---

### Phase 3: Email Monitoring & Response Processing

#### Step 3.1: Agent Monitors Inbox

**Monitoring Strategy**:
```
Option A: Gmail Push Notifications (Preferred)
- Set up Gmail Pub/Sub watch on "Advancing" label
- Webhook receives notification when new email arrives
- Agent triggered immediately

Option B: Polling (Fallback)
- Agent checks inbox every 15 minutes
- Searches for labeled threads with new messages
- Processes new messages
```

**Agent Watching For**:
- Emails in threads labeled "Advancing/[Tour Name]"
- TM can manually label other emails
- Filters out: spam, out-of-office, unrelated

---

#### Step 3.2: Agent Parses Response

**When Response Received**:
```
1. Agent retrieves full email thread context
2. Identifies which show this pertains to (from thread metadata)
3. Extracts structured information using LLM:

   Prompt Template:
   "Analyze this venue response email and extract advancing information.

    Original questions asked:
    [List of questions from draft metadata]

    Show current state:
    [Show object JSON]

    Email content:
    [Email body]

    Extract:
    - Answers to specific questions (map to show object fields)
    - New information not requested
    - Uncertainties or conditional responses
    - Follow-up questions needed
    - Tone/sentiment (cooperative, difficult, unclear)

    Return structured JSON."

4. Agent produces extraction result:
   {
     extractedData: {
       schedule.loadIn: "9:00 AM",
       technical.stageSize: "40' x 30'",
       hospitality.dressingRooms: 2,
       ...
     },
     confidence: {
       schedule.loadIn: 0.95,          // High confidence
       technical.stageSize: 0.80,      // Medium confidence
       ...
     },
     unresolvedQuestions: [
       "Power requirements unclear - says '3-phase available' but doesn't specify amperage"
     ],
     newFollowUpNeeded: [
       "Ask about parking for tour bus",
       "Clarify meal buyout vs catering"
     ],
     sentiment: "cooperative",
     notes: "Contact was very responsive, eager to help"
   }
```

---

#### Step 3.3: TM Reviews Extracted Data

**UI Presentation**:
```
1. Notification: "New advancing info from [Venue Name]"
2. Shows "Review & Approve" screen:

   ORIGINAL EMAIL:
   [Full email displayed]

   EXTRACTED INFORMATION:
   ✓ Load In Time: 9:00 AM (Confidence: 95%)
     [Approve] [Edit] [Reject]

   ✓ Stage Size: 40' x 30' (Confidence: 80%)
     [Approve] [Edit] [Reject]

   ⚠ Power Requirements: "3-phase available" (Confidence: 50%)
     [Approve] [Edit] [Reject]
     Agent note: "Amperage not specified"

   UNRESOLVED:
   - Power amperage details needed

   NEW QUESTIONS IDENTIFIED:
   - Tour bus parking availability
   - Meal buyout amount

3. TM can:
   - Approve all high-confidence extractions
   - Edit uncertain ones
   - Add manual notes
   - Approve update to show object
```

**On Approval**:
```
1. Show object updated with approved data
2. Sync to Master Tour API (itinerary items + day notes)
3. Update advancing checklist (mark fields complete)
4. Store email thread association
5. Trigger agent to generate follow-up
```

---

### Phase 4: Follow-Up & Iteration

#### Step 4.1: Agent Generates Follow-Up Draft

**Automatic Trigger After Data Approval**:
```
1. Agent analyzes current show state
2. Identifies remaining missing fields
3. Identifies unresolved questions from last exchange
4. Generates follow-up email:

   Subject: Re: Advancing [Artist Name] - [Venue Name] - [Date]

   Hi [Contact],

   Thanks so much for getting back to me! I've updated our information:

   ✓ Load In: 9:00 AM - confirmed
   ✓ Stage Size: 40' x 30' - noted
   ✓ Dressing Rooms: 2 available - great!

   Just a few more quick questions:

   1. You mentioned 3-phase power is available - can you confirm the
      amperage? Our rider calls for [X] amps.

   2. Do you have parking available for our tour bus?

   3. For catering, what's the meal buyout amount if we go that route
      instead of using your kitchen?

   Thanks again!
   [Signature]

5. Create Gmail draft
6. Store draft metadata
7. Notify TM for review
```

**Progressive Completion**:
- Each iteration fills in more fields
- Checklist visually shows progress (e.g., 70% complete)
- Agent prioritizes critical missing info
- Stops generating follow-ups when all required fields filled

---

#### Step 4.2: Loop Continues Until Complete

**Loop Iteration**:
```
TM sends follow-up → Venue responds → Agent parses → TM reviews →
Agent generates next follow-up → [repeat]
```

**Completion Criteria**:
```
Show status → "Completed" when:
- All required fields filled (per template)
- No pending questions
- TM manually marks as complete

OR

TM can manually override:
- Mark as complete despite missing optional fields
- Note that venue is unresponsive on certain items
- Escalate if critical info missing close to show date
```

---

### Phase 5: Continuous Sync & Updates

**Bidirectional Sync Throughout Process**:

**Our App → Master Tour**:
```
On any show object update:
1. If schedule time changes → Update MT itinerary item
2. If day notes change → Update MT day notes
3. If contact added → Update MT contacts (if API supports)
4. Sync frequency: Real-time on save + manual sync button
```

**Master Tour → Our App**:
```
When TM clicks "Sync from Master Tour":
1. Fetch latest day/event data from MT API
2. Compare with local show object
3. Detect conflicts:
   - Local changed, MT changed (conflict!)
   - Local changed, MT unchanged (local wins)
   - Local unchanged, MT changed (MT wins)
4. Show conflict resolution UI if needed
5. Merge non-conflicting changes
6. Update show object + UI
```

**Conflict Resolution UI**:
```
CONFLICT DETECTED: Load In Time

Local (Our App):     9:00 AM
Master Tour:         9:30 AM

Last updated locally:  2 hours ago
Last updated in MT:    30 minutes ago

Which version to keep?
○ Keep Local (9:00 AM)
○ Keep Master Tour (9:30 AM)  [Recommended - more recent]
○ Enter New Value: [_______]

[ ] Apply to all conflicts
[Resolve] [Cancel]
```

---

## Advancing Checklist & Progress Tracking

### Checklist Data Model

**Template-Based Checklist**:
```typescript
interface AdvancingChecklist {
  id: UUID,
  showId: UUID,
  templateId: UUID,                  // Reference to advancing template

  sections: [
    {
      name: "Schedule",
      fields: [
        {
          key: "schedule.loadIn",
          label: "Load In Time",
          required: true,
          status: "complete" | "incomplete" | "in_progress",
          value: "9:00 AM",
          source: "venue_email",     // Where data came from
          confidence: 0.95,
          lastUpdated: DateTime
        },
        // ... more fields
      ],
      progress: 0.75                 // 75% complete
    },
    {
      name: "Technical",
      fields: [...],
      progress: 0.40
    },
    // ... more sections
  ],

  overallProgress: 0.65,             // Weighted average
  requiredProgress: 0.80,            // Only required fields
  optionalProgress: 0.50,            // Optional fields

  status: "in_progress",
  completedAt?: DateTime
}
```

### UI Representation

**Show Detail Page**:
```
┌─────────────────────────────────────────────────────┐
│ Dirtwire - The Ritz - March 15, 2025               │
│ [Sync Now] [Start Advancing] [Export PDF]          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Progress: ████████████░░░░ 65%                     │
│ Required: ████████████████░ 80%                    │
│                                                     │
│ ┌─ Schedule ───────────────── 75% ─┐               │
│ │ ✓ Load In Time:     9:00 AM      │               │
│ │ ✓ Sound Check:      4:00 PM      │               │
│ │ ✓ Doors:            7:00 PM      │               │
│ │ ✓ Show Time:        8:30 PM      │               │
│ │ ⚠ Curfew:           [Missing]    │               │
│ │ ✓ Load Out:         ~12:00 AM    │               │
│ └──────────────────────────────────┘               │
│                                                     │
│ ┌─ Technical ──────────────── 40% ─┐               │
│ │ ✓ Stage Size:       40' x 30'    │               │
│ │ ⚠ Power:            [Incomplete] │               │
│ │   "3-phase available" - need amps│               │
│ │ ○ Backline:         [Unknown]    │               │
│ │ ○ PA Specs:         [Unknown]    │               │
│ └──────────────────────────────────┘               │
│                                                     │
│ [View Email Thread] [Generate Follow-Up]           │
└─────────────────────────────────────────────────────┘
```

---

## Email Thread Management

### Thread Tracking

**Database Model**:
```typescript
interface EmailThread {
  id: UUID,
  showId: UUID,
  gmailThreadId: string,
  subject: string,
  participants: string[],            // Email addresses
  messageCount: number,
  lastMessageAt: DateTime,
  status: "active" | "completed" | "stalled",
  stalledReason?: string,            // "No response in 7 days"

  messages: [
    {
      id: UUID,
      gmailMessageId: string,
      from: string,
      to: string[],
      cc: string[],
      subject: string,
      body: string,
      receivedAt: DateTime,
      isDraft: boolean,
      wasProcessed: boolean,
      extractedData?: {
        // What agent pulled from this message
      }
    }
  ],

  drafts: [
    // References to agent-generated drafts
  ],

  labels: string[]                   // Gmail labels
}
```

### UI: Email Thread Viewer

**Integrated Email View**:
```
Show Detail Page → [View Email Thread] button

Opens panel showing:
┌─────────────────────────────────────────────────────┐
│ Email Thread: Advancing Dirtwire - The Ritz        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─ Nov 10, 2025 ─────────────────┐                 │
│ │ From: You → venue@theritz.com  │                 │
│ │                                │                 │
│ │ Hi Sarah,                      │                 │
│ │ We're looking forward to...    │                 │
│ │ [Show Full Email ▼]            │                 │
│ │                                │                 │
│ │ Agent asked for:               │                 │
│ │ • Load in time                 │                 │
│ │ • Stage size                   │                 │
│ │ • Dressing rooms               │                 │
│ └────────────────────────────────┘                 │
│                                                     │
│ ┌─ Nov 11, 2025 ─────────────────┐                 │
│ │ From: venue@theritz.com → You  │                 │
│ │                                │                 │
│ │ Hi! Load in is 9am at the      │                 │
│ │ back entrance. Stage is 40x30. │                 │
│ │ We have 2 dressing rooms.      │                 │
│ │ [Show Full Email ▼]            │                 │
│ │                                │                 │
│ │ Agent extracted:               │                 │
│ │ ✓ Load In: 9:00 AM (95%)       │                 │
│ │ ✓ Stage: 40' x 30' (80%)       │                 │
│ │ ✓ Dressing: 2 rooms (95%)      │                 │
│ │ [Review Updates]               │                 │
│ └────────────────────────────────┘                 │
│                                                     │
│ ┌─ DRAFT: Ready for Review ──────┐                 │
│ │ Thanks Sarah! Just a few more  │                 │
│ │ questions...                   │                 │
│ │                                │                 │
│ │ [Review & Send] [Edit in Gmail]│                 │
│ └────────────────────────────────┘                 │
│                                                     │
│ [Open in Gmail] [Generate New Message]             │
└─────────────────────────────────────────────────────┘
```

---

## Agent State Management (Letta)

### Letta Agent Architecture

**Why Letta**:
- Persistent memory across conversations
- Maintain context of each show's advancing state
- Learn from patterns (what questions work, common responses)
- Function calling for integrations (Gmail, DB, Master Tour)

**Agent Memory Structure**:
```python
# Letta agent core memory for each show
{
  "show_id": "uuid-here",
  "venue_name": "The Ritz",
  "date": "2025-03-15",
  "contact_name": "Sarah Johnson",
  "contact_style": "responsive, detail-oriented",

  "advancing_stage": "in_progress",
  "messages_sent": 2,
  "responses_received": 1,
  "last_interaction": "2025-11-11T14:30:00Z",

  "known_information": {
    "schedule.loadIn": "9:00 AM",
    "schedule.soundCheck": "4:00 PM",
    // ...
  },

  "needed_information": [
    "technical.powerRequirements",
    "hospitality.buyoutAmount",
    // ...
  ],

  "conversation_context": [
    "Initially asked 8 questions",
    "Venue responded promptly with partial info",
    "Need to follow up on power and catering",
    "Contact prefers email over phone"
  ],

  "learned_patterns": {
    "venue_type": "mid-size theater",
    "typical_power": "3-phase, ask for amps",
    "has_buyout": true
  }
}
```

### Agent Functions (Tools)

**Letta agent has access to these functions**:

```python
def create_gmail_draft(
    recipient: str,
    subject: str,
    body: str,
    attachments: List[str],
    show_id: str
) -> Dict:
    """Creates a draft email in Gmail and records in database"""
    pass

def parse_email_for_advancing_info(
    email_body: str,
    questions_asked: List[str],
    show_current_state: Dict
) -> Dict:
    """Extracts structured data from venue response"""
    pass

def update_show_object(
    show_id: str,
    updates: Dict,
    confidence: Dict
) -> Dict:
    """Updates show object in database with confidence scores"""
    pass

def get_show_checklist(show_id: str) -> Dict:
    """Retrieves advancing checklist to see what's needed"""
    pass

def sync_to_master_tour(show_id: str, updates: Dict) -> Dict:
    """Syncs show updates to Master Tour via API"""
    pass

def get_email_thread_history(show_id: str) -> List[Dict]:
    """Retrieves full email thread for context"""
    pass

def notify_tour_manager(
    notification_type: str,
    show_id: str,
    message: str
) -> Dict:
    """Creates UI notification for TM"""
    pass

def mark_draft_for_review(draft_id: str) -> Dict:
    """Adds draft to TM's approval queue"""
    pass
```

### Agent Workflow States

**Agent tracks each show's state machine**:

```
┌─────────────┐
│   CREATED   │ Show added, no advancing yet
└──────┬──────┘
       │
       │ TM clicks "Start Advancing"
       ▼
┌─────────────────────┐
│ GENERATING_INITIAL  │ Agent creating first draft
└──────┬──────────────┘
       │
       │ Draft created
       ▼
┌─────────────────┐
│ AWAITING_REVIEW │ TM needs to approve/edit draft
└──────┬──────────┘
       │
       │ TM sends email
       ▼
┌──────────────────┐
│ AWAITING_RESPONSE│ Monitoring inbox for reply
└──────┬───────────┘
       │
       │ Venue responds
       ▼
┌─────────────────┐
│ PROCESSING_REPLY│ Agent parsing email
└──────┬──────────┘
       │
       │ Extraction complete
       ▼
┌───────────────────────┐
│ AWAITING_APPROVAL     │ TM reviews extracted data
└──────┬────────────────┘
       │
       │ TM approves
       ▼
┌─────────────────────┐
│ GENERATING_FOLLOWUP │ Agent creates next email
└──────┬──────────────┘
       │
       │ Loop back to AWAITING_REVIEW
       │ OR if complete...
       ▼
┌───────────┐
│ COMPLETED │ All required info gathered
└───────────┘

Side branches:
┌─────────┐
│ STALLED │ No response for 7+ days
└─────────┘
┌──────────┐
│ ESCALATED│ Critical issue, needs TM action
└──────────┘
```

---

## Alternative Flows & Edge Cases

### Edge Case 1: Venue Uses Different Email

**Scenario**: Venue contact responds from different email address

**Handling**:
```
1. Agent detects new sender in thread
2. Checks if name matches (fuzzy match)
3. If match, adds email to contact list
4. If no match, flags for TM review:

   "⚠️ New participant in thread: john@theritz.com
    Expected: sarah@theritz.com

    Message appears to be from venue staff.
    Should I add John as additional contact?
    [Yes - Add Contact] [No - Ignore]"
```

### Edge Case 2: Venue Provides Conflicting Info

**Scenario**: Load in time said 9am in first email, 10am in second

**Handling**:
```
1. Agent detects conflict during parsing
2. Flags for TM review:

   "⚠️ CONFLICT: Load In Time

   Previous: 9:00 AM (from email on Nov 11)
   Latest:   10:00 AM (from email on Nov 13)

   Which is correct?
   ○ 9:00 AM (original)
   ○ 10:00 AM (updated)  [Recommended - more recent]
   ○ Ask venue to clarify

   [Resolve]"
```

### Edge Case 3: Urgent Last-Minute Changes

**Scenario**: Venue emails 2 days before show with major change

**Handling**:
```
1. Agent detects show date proximity
2. Parses change details
3. Immediately escalates:

   "🚨 URGENT: Last-minute change for The Ritz show

   Show Date: March 15 (2 days away!)
   Change: Load in moved from 9am to 7am

   Agent has updated show object.
   Action needed:
   1. Review change
   2. Notify crew
   3. Update call times

   [Review Change] [Acknowledge]"

4. Automatically syncs to Master Tour
5. Creates high-priority notification
```

### Edge Case 4: Venue Unresponsive

**Scenario**: No response after 7 days

**Handling**:
```
1. Agent monitors time since last sent email
2. After 7 days with no response:

   "⚠️ No response from The Ritz in 7 days

   Last email sent: Nov 10
   Still needed: Power specs, buyout amount
   Show date: March 15 (4 months away)

   Suggested actions:
   ○ Send automated follow-up (gentle nudge)
   ○ Try phone call (if number available)
   ○ Wait another week
   ○ Escalate to booking agent

   [Choose Action]"

3. If TM selects "automated follow-up":
   Agent generates:
   "Hi Sarah, just checking in on my email from last week...
   wanted to make sure it didn't get lost..."
```

### Edge Case 5: Multiple Venues in Same Thread

**Scenario**: Email thread has multiple venues CC'd (festival, multi-venue run)

**Handling**:
```
1. Agent detects multiple venue contacts
2. Associates thread with multiple shows
3. When parsing responses, asks:

   "This thread is associated with:
   - The Ritz (March 15)
   - The Fillmore (March 17)

   Response from Sarah @ The Ritz:
   'Load in is 9am...'

   Apply to: ☑ The Ritz only
             ☐ All venues in thread

   [Apply]"
```

---

## Security & Privacy Considerations

### Email Access

**Gmail API Permissions Required**:
- `gmail.readonly`: Read emails
- `gmail.compose`: Create drafts
- `gmail.modify`: Add labels
- `gmail.send`: Send emails (optional, TM can send manually)

**OAuth Scope Limitations**:
- Agent cannot delete emails
- Agent cannot access non-labeled emails
- Agent cannot modify sent emails
- All access logged and auditable

### Data Handling

**Sensitive Information**:
- Financial terms (guarantees) stored encrypted
- Contact info (phone, email) access-controlled
- Email content not shared externally
- Agent memory stored securely in Letta
- Master Tour API keys encrypted at rest

**User Control**:
- TM can disable agent at any time
- All agent actions require TM approval for critical ops
- Agent suggestions, not autonomous actions
- Clear audit trail of all changes

---

## Success Metrics

### Agent Performance KPIs

**Efficiency Metrics**:
- Time to complete advancing: Target 50% reduction
- Number of email exchanges: Target <5 per show
- TM review time per draft: Target <2 minutes
- Parsing accuracy: Target >90% confidence

**Quality Metrics**:
- Extraction accuracy: % of correct field values
- Draft approval rate: % of drafts sent without edits
- Show completion rate: % reaching 100% checklist
- Conflict frequency: # of sync conflicts per show

**User Satisfaction**:
- TM time saved per show (survey)
- Agent helpfulness rating (1-5)
- Feature usage rate
- Escalation frequency (lower is better)

---

## Future Enhancements

### Phase 2 Features

**Multi-Language Support**:
- Agent detects venue's language
- Generates drafts in appropriate language
- Parses responses in multiple languages

**Venue Intelligence**:
- Build knowledge base of venues
- "We've worked with The Ritz before, here's what they typically provide..."
- Pre-populate advancing based on historical data

**Predictive Advancing**:
- Agent predicts what info venue will provide
- Pre-generates questions based on venue type
- Learns optimal question ordering

**Voice Integration**:
- TM dictates notes after phone calls
- Agent transcribes and extracts info
- Updates show object from voice notes

**Calendar Integration**:
- Auto-create Google Calendar events from show data
- Sync updates bidirectionally
- Send calendar invites to crew

**Document Processing**:
- Agent reads attached venue tech specs (PDFs)
- Extracts structured data from contracts
- Identifies discrepancies with rider

---

## Conclusion

This workflow represents a **human-in-the-loop AI system** where:

✅ **Agent handles repetitive tasks**:
   - Drafting emails
   - Parsing responses
   - Identifying missing information
   - Maintaining context across threads

✅ **TM maintains control**:
   - Approves all outgoing communications
   - Reviews extracted data
   - Resolves conflicts
   - Makes final decisions

✅ **System provides intelligence**:
   - Confidence scores on extracted data
   - Conflict detection
   - Progress tracking
   - Escalation of urgent issues

✅ **Seamless integration**:
   - Bidirectional sync with Master Tour
   - Native email workflow (Gmail)
   - Real-time UI updates
   - Audit trail for all actions

**Result**: Tour managers spend less time on repetitive advancing tasks and more time on creative and strategic work, while maintaining full control and visibility into the process.
