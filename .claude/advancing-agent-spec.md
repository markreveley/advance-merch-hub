# Advancing Agent Technical Specification

**Date**: 2025-11-18
**Framework**: Letta (letta.com)
**Purpose**: Technical specification for AI agents that automate advancing workflow

---

## Overview

This document specifies the technical implementation of AI agents using Letta to automate tour advancing. The system uses multiple specialized agents coordinated by a main orchestrator, with extensive integration into Gmail, Master Tour API, and our Supabase backend.

---

## Letta Framework Overview

### What is Letta?

**Letta** (formerly MemGPT) is a framework for building stateful LLM agents with:
- **Persistent Memory**: Agents maintain context across conversations
- **Function Calling**: Direct integration with external tools/APIs
- **Memory Management**: Automatic archival and retrieval of long-term context
- **Multi-Agent Systems**: Coordinate specialized agents

### Why Letta for Advancing?

✅ **Stateful conversations**: Each show's advancing is a long-running conversation
✅ **Context retention**: Remember entire email thread, past interactions
✅ **Tool integration**: Call Gmail API, database, Master Tour API as needed
✅ **Learning**: Improve drafts based on TM feedback and venue patterns
✅ **Multi-show management**: One agent instance per show, coordinated centrally

---

## Agent Architecture

### Multi-Agent System

```
┌─────────────────────────────────────────────────────────┐
│          Advancing Coordinator Agent (Main)             │
│                                                         │
│  - Manages all shows                                    │
│  - Delegates to specialized agents                      │
│  - Handles escalations                                  │
│  - Monitors overall progress                            │
└────────┬──────────────────────┬────────────────────┬────┘
         │                      │                    │
         │                      │                    │
┌────────▼────────┐   ┌─────────▼────────┐   ┌──────▼────────┐
│  Draft Generator│   │  Email Parser    │   │  Sync Manager │
│      Agent      │   │      Agent       │   │     Agent     │
│                 │   │                  │   │               │
│  - Creates      │   │  - Extracts      │   │  - MT API     │
│    initial      │   │    structured    │   │    sync       │
│    emails       │   │    data from     │   │  - Conflict   │
│  - Generates    │   │    responses     │   │    resolution │
│    follow-ups   │   │  - Confidence    │   │  - Data       │
│  - Personalizes │   │    scoring       │   │    validation │
│    templates    │   │  - Sentiment     │   │               │
└─────────────────┘   └──────────────────┘   └───────────────┘
```

### Agent Communication

```python
# Coordinator delegates to specialized agents
coordinator = LettaAgent("advancing_coordinator")

# When TM clicks "Start Advancing"
coordinator.message(
    f"Start advancing for show {show_id}. Generate initial email."
)

# Coordinator calls Draft Generator
draft_agent = LettaAgent(f"draft_generator_{show_id}")
draft = draft_agent.generate_initial_email(show_data)

# Coordinator creates Gmail draft and notifies TM
coordinator.create_draft_and_notify(draft)
```

---

## Agent 1: Advancing Coordinator

### Purpose
Main orchestrator that manages the advancing workflow for all shows.

### Core Memory Schema

```python
{
  "human": "Tour Manager: [Name]",
  "persona": """
    You are an AI assistant specializing in tour advancing. You help tour
    managers communicate with venues to gather logistics information. You
    are professional, detail-oriented, and proactive. You draft emails,
    parse venue responses, and track progress across multiple shows.

    Your role is to:
    - Generate personalized advancing emails
    - Extract information from venue responses
    - Track what's known vs. needed for each show
    - Alert TM to issues and conflicts
    - Suggest next steps

    You work FOR the tour manager, not autonomously. Always await approval
    before sending emails. Be conservative with confidence scores.
  """,

  "active_shows": [
    {
      "show_id": "uuid-1",
      "venue": "The Ritz",
      "date": "2025-03-15",
      "status": "awaiting_response",
      "last_action": "Sent initial email on Nov 10"
    },
    // ... more shows
  ],

  "preferences": {
    "email_tone": "professional_friendly",
    "follow_up_days": 7,
    "urgency_threshold_days": 14,  // Days before show to escalate
    "confidence_threshold": 0.80    // Min confidence to auto-apply
  },

  "learned_patterns": {
    "theater_venues_typically_provide": ["stage_size", "power", "dressing_rooms"],
    "club_venues_often_need_followup_on": ["buyout", "parking"],
    "festival_response_time_avg": "3-5 days"
  }
}
```

### Functions (Tools)

```python
class AdvancingCoordinator:
    def __init__(self, agent_id: str):
        self.agent = LettaAgent(agent_id)
        self.tools = [
            # Show Management
            "get_show_details",
            "update_show_status",
            "get_advancing_checklist",
            "mark_field_complete",

            # Email Operations
            "create_gmail_draft",
            "get_email_thread",
            "label_email",
            "monitor_inbox",

            # Delegation
            "call_draft_generator",
            "call_email_parser",
            "call_sync_manager",

            # Notifications
            "notify_tm_draft_ready",
            "notify_tm_response_received",
            "alert_tm_escalation",

            # Database
            "query_shows",
            "query_email_threads",
            "query_advancing_history"
        ]

    def start_advancing(self, show_id: str):
        """Initiates advancing workflow for a show"""
        show = self.get_show_details(show_id)

        # Check if already started
        if show.advancing_status != "draft":
            return {"error": "Advancing already in progress"}

        # Delegate to Draft Generator
        draft = self.call_draft_generator(
            show_id=show_id,
            action="generate_initial",
            context=show
        )

        # Create Gmail draft
        gmail_draft = self.create_gmail_draft(
            recipient=show.primary_contact.email,
            subject=f"Advancing {show.artist_name} - {show.venue_name} - {show.date}",
            body=draft.body,
            attachments=draft.attachments
        )

        # Store draft metadata
        self.store_draft_metadata(
            show_id=show_id,
            gmail_draft_id=gmail_draft.id,
            questions_asked=draft.questions_asked,
            fields_requested=draft.fields_requested
        )

        # Update show status
        self.update_show_status(show_id, "draft_pending_approval")

        # Notify TM
        self.notify_tm_draft_ready(show_id, gmail_draft.id)

        return {
            "success": True,
            "draft_id": gmail_draft.id,
            "message": "Initial advancing email draft created"
        }

    def process_venue_response(self, email_data: dict):
        """Processes incoming venue response email"""
        # Identify which show this is for
        show_id = self.identify_show_from_email(email_data)

        if not show_id:
            return {"error": "Could not identify show"}

        # Delegate to Email Parser
        extracted_data = self.call_email_parser(
            show_id=show_id,
            email_content=email_data.body,
            thread_context=self.get_email_thread(email_data.thread_id)
        )

        # Store extracted data
        self.store_extraction_result(show_id, extracted_data)

        # Update show status
        self.update_show_status(show_id, "awaiting_approval")

        # Notify TM
        self.notify_tm_response_received(
            show_id=show_id,
            extraction_id=extracted_data.id,
            confidence_summary=extracted_data.confidence_summary
        )

        return {
            "success": True,
            "extracted_fields": len(extracted_data.fields),
            "avg_confidence": extracted_data.avg_confidence
        }

    def generate_followup(self, show_id: str, approved_data: dict):
        """Generates follow-up email after TM approves extracted data"""
        # Apply approved data to show
        self.apply_updates_to_show(show_id, approved_data)

        # Sync to Master Tour
        self.call_sync_manager(
            show_id=show_id,
            action="sync_to_master_tour",
            updates=approved_data
        )

        # Check what's still needed
        checklist = self.get_advancing_checklist(show_id)
        incomplete_fields = [f for f in checklist.fields if not f.complete]

        if not incomplete_fields:
            # Advancing complete!
            self.update_show_status(show_id, "completed")
            return {"success": True, "message": "Advancing complete!"}

        # Generate follow-up draft
        followup = self.call_draft_generator(
            show_id=show_id,
            action="generate_followup",
            incomplete_fields=incomplete_fields,
            thread_context=self.get_email_thread_for_show(show_id)
        )

        # Create draft
        gmail_draft = self.create_gmail_draft(
            thread_id=self.get_thread_id_for_show(show_id),  # Reply to thread
            body=followup.body
        )

        # Notify TM
        self.notify_tm_draft_ready(show_id, gmail_draft.id)

        return {"success": True, "draft_id": gmail_draft.id}
```

---

## Agent 2: Draft Generator

### Purpose
Specialized agent for creating personalized advancing emails.

### Core Memory Schema

```python
{
  "show_id": "uuid-1",
  "venue_name": "The Ritz",
  "venue_type": "theater",  // Inferred or from DB
  "contact_name": "Sarah Johnson",
  "contact_history": {
    "previous_responses": 1,
    "avg_response_time_hours": 24,
    "response_completeness": "high",  // Answers questions thoroughly
    "communication_style": "professional, friendly"
  },

  "email_history": [
    {
      "sent_at": "2025-11-10",
      "type": "initial",
      "questions_asked": 8,
      "fields_requested": ["loadIn", "stageSize", "dressingRooms", ...]
    }
  ],

  "template_preferences": {
    "tone": "professional_friendly",
    "structure": "confirm_then_ask",
    "max_questions_per_email": 8,
    "include_rider": True
  }
}
```

### Functions

```python
class DraftGeneratorAgent:
    def generate_initial_email(
        self,
        show: dict,
        template: dict = None
    ) -> dict:
        """
        Generates first advancing email.

        Args:
            show: Show object with current data
            template: Optional custom template

        Returns:
            {
                "subject": str,
                "body": str,
                "attachments": [str],
                "questions_asked": [str],
                "fields_requested": [str],
                "tone": str,
                "confidence": float
            }
        """
        # Build context for LLM
        context = self._build_initial_context(show)

        # Prompt LLM to generate email
        prompt = f"""
        Generate a professional advancing email for the following show:

        SHOW DETAILS:
        {json.dumps(show, indent=2)}

        KNOWN INFORMATION (from contract):
        {json.dumps(context.known_fields, indent=2)}

        NEEDED INFORMATION (missing fields):
        {json.dumps(context.needed_fields, indent=2)}

        VENUE CONTACT:
        Name: {show.primary_contact.name}
        Email: {show.primary_contact.email}
        Role: {show.primary_contact.role or "Unknown"}

        TOUR MANAGER:
        Name: {context.tm_name}
        Artist: {show.artist_name}

        INSTRUCTIONS:
        1. Greet contact by name
        2. Express excitement about the show
        3. Confirm known details (date, time, etc.)
        4. Ask for missing information
           - Group related questions together
           - Be specific (don't ask "What's your power?" - ask "What amperage is your 3-phase power?")
           - Prioritize critical items (load in, schedule, technical)
        5. Mention rider attachment
        6. Set expectation for response (e.g., "at your earliest convenience")
        7. Professional closing with TM's signature

        TONE: Professional but friendly, not overly formal

        CONSTRAINTS:
        - Maximum 8 questions in this email
        - Keep email concise (under 300 words)
        - Use bullet points or numbered lists for questions
        - Include specific times/dates where relevant

        Generate the email body as plain text (we'll handle formatting).
        After the email, list:
        QUESTIONS_ASKED: [array of questions]
        FIELDS_REQUESTED: [array of show object field keys]
        """

        # Call LLM
        response = self.agent.message(prompt)

        # Parse response
        email_body = self._extract_email_body(response)
        questions = self._extract_questions(response)
        fields = self._extract_fields(response)

        return {
            "subject": f"Advancing {show.artist_name} - {show.venue_name} - {show.date_formatted}",
            "body": email_body,
            "attachments": [show.rider_pdf_url],
            "questions_asked": questions,
            "fields_requested": fields,
            "tone": "professional_friendly",
            "confidence": 0.85  # High confidence on generated drafts
        }

    def generate_followup_email(
        self,
        show: dict,
        incomplete_fields: list,
        thread_history: list,
        last_venue_response: dict
    ) -> dict:
        """
        Generates follow-up email based on thread history.
        """
        prompt = f"""
        Generate a follow-up email in an ongoing advancing conversation.

        PREVIOUS CONVERSATION:
        {self._format_thread_history(thread_history)}

        WHAT WE LEARNED FROM LAST RESPONSE:
        {json.dumps(last_venue_response.extracted_data, indent=2)}

        WHAT WE STILL NEED:
        {json.dumps(incomplete_fields, indent=2)}

        INSTRUCTIONS:
        1. Thank contact for previous response
        2. Confirm what we learned (shows we're listening)
        3. Ask follow-up questions ONLY for missing information
        4. Reference specific parts of their response if relevant
           (e.g., "You mentioned 3-phase power - can you confirm the amperage?")
        5. Keep it brief and focused
        6. Warm, appreciative tone

        This is a REPLY in an existing thread, so don't repeat greeting/intro.
        Start with "Thanks for getting back to me!" or similar.
        """

        response = self.agent.message(prompt)

        return {
            "body": self._extract_email_body(response),
            "questions_asked": self._extract_questions(response),
            "fields_requested": incomplete_fields,
            "confidence": 0.90  # Higher confidence on follow-ups (more context)
        }

    def regenerate_with_feedback(
        self,
        original_draft: dict,
        tm_feedback: str,
        show: dict
    ) -> dict:
        """
        Regenerates draft incorporating TM's feedback.
        """
        prompt = f"""
        The tour manager reviewed your draft and provided feedback.
        Please revise the email accordingly.

        ORIGINAL DRAFT:
        {original_draft.body}

        TM FEEDBACK:
        {tm_feedback}

        CONTEXT:
        {json.dumps(show, indent=2)}

        Generate a revised email that addresses the feedback while maintaining
        professionalism and achieving the advancing goals.
        """

        response = self.agent.message(prompt)

        return {
            "body": self._extract_email_body(response),
            "questions_asked": original_draft.questions_asked,  # Same questions
            "fields_requested": original_draft.fields_requested,
            "confidence": 0.95  # Very high confidence after TM review
        }
```

---

## Agent 3: Email Parser

### Purpose
Extracts structured data from venue response emails with confidence scoring.

### Core Memory Schema

```python
{
  "show_id": "uuid-1",
  "venue_name": "The Ritz",

  "extraction_history": [
    {
      "email_date": "2025-11-11",
      "fields_extracted": 5,
      "avg_confidence": 0.87,
      "manual_corrections": 1  // How many TM corrected
    }
  ],

  "venue_patterns": {
    "date_format": "MM/DD/YYYY",  // How this venue writes dates
    "time_format": "12hr",         // 12-hour vs 24-hour
    "typical_response_format": "numbered_list",
    "key_phrases": {
      "load_in": ["back door", "loading dock", "rear entrance"],
      "power": ["3-phase", "220v", "amps"]
    }
  },

  "learning_data": {
    "successful_extractions": 12,
    "failed_extractions": 2,
    "tm_approval_rate": 0.92
  }
}
```

### Functions

```python
class EmailParserAgent:
    def extract_advancing_data(
        self,
        email_content: str,
        questions_asked: list,
        current_show_state: dict,
        thread_context: list = None
    ) -> dict:
        """
        Extracts structured data from venue response email.

        Returns:
        {
            "extracted_data": {
                "schedule.loadIn": {
                    "value": "9:00 AM",
                    "confidence": 0.95,
                    "source_text": "Load in is at 9am at the back door",
                    "reasoning": "Explicit time stated, standard format"
                },
                "technical.stageSize": {
                    "value": "40' x 30'",
                    "confidence": 0.80,
                    "source_text": "Stage is 40 by 30",
                    "reasoning": "Dimensions stated but missing feet/meters unit, assumed feet"
                },
                // ... more fields
            },
            "unresolved_questions": [
                "Power amperage not specified (said '3-phase available' but no amps)"
            ],
            "new_questions_needed": [
                "Ask about tour bus parking (mentioned 'limited parking')"
            ],
            "sentiment": {
                "tone": "cooperative",
                "responsiveness": "high",
                "clarity": "medium",
                "concerns": []
            },
            "overall_confidence": 0.87
        }
        """

        # Build extraction prompt
        prompt = f"""
        Analyze this venue response email and extract structured advancing information.

        ORIGINAL QUESTIONS WE ASKED:
        {json.dumps(questions_asked, indent=2)}

        CURRENT SHOW STATE (what we already know):
        {json.dumps(current_show_state, indent=2)}

        EMAIL FROM VENUE:
        {email_content}

        {"THREAD HISTORY:\n" + self._format_thread(thread_context) if thread_context else ""}

        EXTRACTION TASK:
        For each piece of information in the email, extract:
        1. Which field it corresponds to (e.g., "schedule.loadIn", "technical.stageSize")
        2. The exact value
        3. Confidence score (0.0-1.0):
           - 1.0: Explicit, unambiguous ("Load in is at 9:00 AM")
           - 0.8: Clear but minor ambiguity ("Load in around 9")
           - 0.6: Implicit or requires inference ("We open at 9" → load in likely before)
           - 0.4: Very uncertain, needs clarification
        4. Source text: Exact quote from email
        5. Reasoning: Why you assigned this confidence score

        FIELD MAPPING:
        - Load in time → schedule.loadIn (format: HH:MM AM/PM)
        - Sound check → schedule.soundCheck
        - Doors → schedule.doors
        - Show time → schedule.showTime
        - Curfew → schedule.curfew
        - Stage size → technical.stageSize (format: "L' x W'")
        - Power → technical.powerRequirements (include voltage, phase, amperage)
        - Backline → technical.backlineProvided (boolean)
        - Dressing rooms → hospitality.dressingRooms (integer)
        - Buyout → hospitality.buyoutAmount (number)
        - Guest list → hospitality.guestListAllocation (integer)
        - Parking → hospitality.parkingSpaces (integer)
        - Contact name → primaryContact.name
        - Contact phone → primaryContact.phone
        - Contact role → primaryContact.role

        ALSO IDENTIFY:
        - Questions that were asked but NOT answered
        - New information provided that we didn't ask for
        - Follow-up questions we should ask based on partial answers
        - Overall tone/sentiment of the response

        RESPOND IN VALID JSON FORMAT with the structure shown above.
        """

        # Call LLM
        response = self.agent.message(prompt)

        # Parse JSON response
        try:
            extraction = json.loads(self._extract_json(response))
        except json.JSONDecodeError:
            # Fallback: ask agent to fix JSON
            fix_prompt = "The previous response was not valid JSON. Please provide ONLY valid JSON with no additional text."
            response = self.agent.message(fix_prompt)
            extraction = json.loads(self._extract_json(response))

        # Validate extracted data
        extraction = self._validate_extraction(extraction, current_show_state)

        # Store extraction for learning
        self._store_extraction_result(extraction)

        return extraction

    def _validate_extraction(self, extraction: dict, current_state: dict) -> dict:
        """
        Validates extracted data for consistency and flags issues.
        """
        validated = extraction.copy()

        for field_key, field_data in extraction["extracted_data"].items():
            # Check for conflicts with current state
            if field_key in current_state and current_state[field_key]:
                if current_state[field_key] != field_data["value"]:
                    # Conflict detected!
                    validated["extracted_data"][field_key]["conflict"] = {
                        "previous_value": current_state[field_key],
                        "new_value": field_data["value"],
                        "needs_resolution": True
                    }
                    # Lower confidence
                    validated["extracted_data"][field_key]["confidence"] *= 0.7

            # Validate data types and formats
            if "schedule" in field_key:
                # Should be time format
                if not self._is_valid_time(field_data["value"]):
                    validated["extracted_data"][field_key]["confidence"] *= 0.5
                    validated["extracted_data"][field_key]["validation_warning"] = "Time format uncertain"

            if "technical.stageSize" == field_key:
                # Should be dimensions
                if not re.match(r"\d+['\"]?\s*x\s*\d+['\"]?", field_data["value"]):
                    validated["extracted_data"][field_key]["confidence"] *= 0.6
                    validated["extracted_data"][field_key"]["validation_warning"] = "Dimension format uncertain"

        return validated

    def analyze_sentiment(self, email_content: str) -> dict:
        """
        Analyzes tone and sentiment of venue response.
        Useful for identifying potential issues early.
        """
        prompt = f"""
        Analyze the tone and sentiment of this venue response:

        {email_content}

        Provide:
        1. Overall tone (cooperative, neutral, difficult, enthusiastic, etc.)
        2. Responsiveness (answered all questions, partial, vague, unresponsive)
        3. Clarity (clear, somewhat clear, unclear, confusing)
        4. Any concerns or red flags
        5. Suggestions for how to approach next communication

        Format as JSON:
        {{
            "tone": "cooperative",
            "responsiveness": "high",
            "clarity": "medium",
            "concerns": ["mentioned 'limited parking' - may be an issue"],
            "suggestions": ["Follow up on parking specifics ASAP"],
            "overall_assessment": "positive"
        }}
        """

        response = self.agent.message(prompt)
        return json.loads(self._extract_json(response))
```

---

## Agent 4: Sync Manager

### Purpose
Handles bidirectional sync with Master Tour API and conflict resolution.

### Core Memory Schema

```python
{
  "master_tour_api": {
    "base_url": "https://my.eventric.com/api/v5",
    "auth_type": "oauth1",
    "rate_limit": None,  // Not documented
    "last_sync": "2025-11-18T10:30:00Z"
  },

  "sync_history": [
    {
      "timestamp": "2025-11-18T10:30:00Z",
      "direction": "to_master_tour",
      "show_id": "uuid-1",
      "fields_synced": ["schedule.loadIn", "schedule.doors"],
      "success": True,
      "conflicts": 0
    }
  ],

  "conflict_resolution_rules": {
    "prefer": "most_recent",  // or "master_tour", "local", "ask_user"
    "auto_resolve_threshold": 0.95,  // Only auto-resolve if very confident
    "critical_fields": ["schedule.showTime", "venue.name", "date"]  // Always ask user
  }
}
```

### Functions

```python
class SyncManagerAgent:
    def sync_to_master_tour(
        self,
        show_id: str,
        updates: dict
    ) -> dict:
        """
        Syncs show updates to Master Tour via API.

        Maps our show object to Master Tour's schema:
        - schedule.loadIn → Create/update itinerary item "Load In"
        - schedule.doors → Create/update itinerary item "Doors"
        - hospitality notes → Update day notes
        - etc.
        """
        show = self.get_show(show_id)

        # Get or create MT day
        mt_day = self._get_or_create_mt_day(show)

        sync_results = {
            "itinerary_items_created": [],
            "itinerary_items_updated": [],
            "day_notes_updated": False,
            "errors": []
        }

        # Map schedule times to itinerary items
        schedule_mapping = {
            "schedule.loadIn": "Load In",
            "schedule.soundCheck": "Sound Check",
            "schedule.doors": "Doors",
            "schedule.showTime": "Show Time",
            "schedule.curfew": "Curfew"
        }

        for field_key, item_title in schedule_mapping.items():
            if field_key in updates:
                # Check if itinerary item exists
                existing = self._find_itinerary_item(mt_day.id, item_title)

                if existing:
                    # Update existing
                    result = self.master_tour_api.update_itinerary_item(
                        item_id=existing.id,
                        updates={
                            "startDatetime": self._to_iso_datetime(updates[field_key]),
                            "isConfirmed": True
                        }
                    )
                    sync_results["itinerary_items_updated"].append(item_title)
                else:
                    # Create new
                    result = self.master_tour_api.create_itinerary_item(
                        parentDayId=mt_day.id,
                        title=item_title,
                        startDatetime=self._to_iso_datetime(updates[field_key]),
                        isConfirmed=True,
                        timePriority=self._get_time_priority(item_title)
                    )
                    sync_results["itinerary_items_created"].append(item_title)

        # Sync notes to day notes
        notes_to_sync = []
        if "technical" in updates:
            notes_to_sync.append(f"TECHNICAL:\n{json.dumps(updates['technical'], indent=2)}")
        if "hospitality" in updates:
            notes_to_sync.append(f"HOSPITALITY:\n{json.dumps(updates['hospitality'], indent=2)}")

        if notes_to_sync:
            self.master_tour_api.update_day(
                day_id=mt_day.id,
                updates={
                    "generalNotes": "\n\n".join(notes_to_sync)
                }
            )
            sync_results["day_notes_updated"] = True

        # Update sync timestamp
        self.update_show(show_id, {"lastSyncedAt": datetime.now()})

        return sync_results

    def sync_from_master_tour(
        self,
        show_id: str
    ) -> dict:
        """
        Pulls latest data from Master Tour and merges with local.
        Detects and flags conflicts.
        """
        show = self.get_show(show_id)

        if not show.masterTourDayId:
            return {"error": "Show not linked to Master Tour day"}

        # Fetch MT data
        mt_day = self.master_tour_api.get_day(show.masterTourDayId)
        mt_itinerary = self.master_tour_api.get_day_summary(
            show.tourId,
            show.date
        )

        # Extract schedule times from itinerary
        mt_schedule = self._extract_schedule_from_itinerary(mt_itinerary)

        # Compare with local
        conflicts = []
        safe_updates = {}

        for field_key, mt_value in mt_schedule.items():
            local_value = self._get_nested_field(show, field_key)

            if local_value and local_value != mt_value:
                # Conflict!
                conflicts.append({
                    "field": field_key,
                    "local_value": local_value,
                    "master_tour_value": mt_value,
                    "local_updated_at": show.updatedAt,
                    "master_tour_updated_at": mt_day.updatedAt,
                    "recommended": self._recommend_resolution(
                        local_value,
                        mt_value,
                        show.updatedAt,
                        mt_day.updatedAt
                    )
                })
            elif not local_value and mt_value:
                # MT has data we don't, safe to apply
                safe_updates[field_key] = mt_value

        # Auto-apply safe updates
        if safe_updates:
            self.update_show(show_id, safe_updates)

        # Return conflicts for user resolution
        return {
            "safe_updates_applied": safe_updates,
            "conflicts": conflicts,
            "requires_user_resolution": len(conflicts) > 0
        }

    def _recommend_resolution(
        self,
        local: Any,
        mt: Any,
        local_time: datetime,
        mt_time: datetime
    ) -> str:
        """
        Recommends which value to keep based on rules.
        """
        # Most recent wins
        if mt_time > local_time:
            return "master_tour"
        elif local_time > mt_time:
            return "local"
        else:
            # Same time, prefer MT as source of truth
            return "master_tour"
```

---

## Integration Layer

### Gmail API Integration

```python
class GmailIntegration:
    def __init__(self, credentials: dict):
        self.service = build('gmail', 'v1', credentials=credentials)

    def create_draft(
        self,
        to: str,
        subject: str,
        body: str,
        cc: List[str] = None,
        attachments: List[str] = None,
        thread_id: str = None  # For replies
    ) -> dict:
        """Creates a draft email in Gmail"""
        message = self._create_message(to, subject, body, cc, attachments)

        draft_body = {
            'message': {
                'raw': base64.urlsafe_b64encode(message.as_bytes()).decode(),
                'threadId': thread_id
            }
        }

        draft = self.service.users().drafts().create(
            userId='me',
            body=draft_body
        ).execute()

        return {
            "id": draft['id'],
            "message_id": draft['message']['id'],
            "thread_id": draft['message'].get('threadId')
        }

    def setup_push_notifications(
        self,
        webhook_url: str,
        label_filter: str = "Advancing"
    ) -> dict:
        """
        Sets up Gmail push notifications via Google Cloud Pub/Sub.
        When new email arrives with "Advancing" label, webhook is triggered.
        """
        request = {
            'labelIds': [self._get_label_id(label_filter)],
            'topicName': 'projects/YOUR_PROJECT/topics/gmail-advancing'
        }

        watch_response = self.service.users().watch(
            userId='me',
            body=request
        ).execute()

        return {
            "history_id": watch_response['historyId'],
            "expiration": watch_response['expiration']
        }

    def get_thread_messages(self, thread_id: str) -> List[dict]:
        """Retrieves all messages in a thread"""
        thread = self.service.users().threads().get(
            userId='me',
            id=thread_id,
            format='full'
        ).execute()

        return [
            {
                "id": msg['id'],
                "from": self._extract_header(msg, 'From'),
                "to": self._extract_header(msg, 'To'),
                "subject": self._extract_header(msg, 'Subject'),
                "date": self._extract_header(msg, 'Date'),
                "body": self._extract_body(msg)
            }
            for msg in thread['messages']
        ]

    def label_email(self, message_id: str, label: str):
        """Adds label to email"""
        label_id = self._get_or_create_label(label)

        self.service.users().messages().modify(
            userId='me',
            id=message_id,
            body={'addLabelIds': [label_id]}
        ).execute()
```

### Webhook Handler

```python
# FastAPI webhook endpoint
from fastapi import FastAPI, Request
import asyncio

app = FastAPI()

@app.post("/webhooks/gmail")
async def gmail_webhook(request: Request):
    """
    Receives push notification from Gmail when new email arrives.
    Triggers agent to process the email.
    """
    data = await request.json()

    # Decode Pub/Sub message
    message_data = base64.b64decode(data['message']['data'])
    notification = json.loads(message_data)

    history_id = notification['historyId']

    # Fetch new messages since last history ID
    new_messages = gmail.get_history(history_id)

    for message in new_messages:
        # Check if it's an advancing email
        if "Advancing" in message.labels:
            # Trigger agent processing
            asyncio.create_task(
                process_advancing_email(message.id)
            )

    return {"status": "ok"}

async def process_advancing_email(message_id: str):
    """
    Processes incoming advancing email with agent.
    """
    # Get full message
    message = gmail.get_message(message_id)

    # Identify show
    show_id = identify_show_from_thread(message.thread_id)

    if not show_id:
        # Can't identify show, flag for manual review
        notify_tm_unidentified_email(message_id)
        return

    # Get coordinator agent
    coordinator = get_advancing_coordinator()

    # Process with agent
    result = coordinator.process_venue_response({
        "message_id": message_id,
        "thread_id": message.thread_id,
        "from": message.from_email,
        "subject": message.subject,
        "body": message.body,
        "date": message.date
    })

    # Result stored in DB, TM notified via UI
    return result
```

---

## Database Schema Extensions

### New Tables for Agent System

```sql
-- Email threads associated with shows
CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  gmail_thread_id TEXT NOT NULL,
  subject TEXT,
  participants TEXT[],  -- Array of email addresses
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',  -- active, completed, stalled
  stalled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gmail_thread_id)
);

-- Individual messages in threads
CREATE TABLE email_messages (
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
  UNIQUE(gmail_message_id)
);

-- Agent-generated drafts awaiting TM approval
CREATE TABLE agent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id),
  gmail_draft_id TEXT UNIQUE,
  draft_type TEXT NOT NULL,  -- initial, followup, regenerated
  subject TEXT,
  body TEXT,
  recipients TEXT[],
  cc_recipients TEXT[],
  attachments JSONB,  -- [{url, filename, type}]
  questions_asked TEXT[],
  fields_requested TEXT[],
  status TEXT DEFAULT 'pending_review',  -- pending_review, approved, rejected, sent
  agent_confidence NUMERIC(3,2),
  tm_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

-- Extracted data from venue responses
CREATE TABLE email_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL,  -- {field_key: {value, confidence, source_text, reasoning}}
  unresolved_questions TEXT[],
  new_questions_needed TEXT[],
  sentiment JSONB,  -- {tone, responsiveness, clarity, concerns}
  overall_confidence NUMERIC(3,2),
  status TEXT DEFAULT 'pending_approval',  -- pending_approval, approved, rejected
  tm_corrections JSONB,  -- What TM changed
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity log for debugging and learning
CREATE TABLE agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,  -- coordinator, draft_generator, email_parser, sync_manager
  agent_id TEXT NOT NULL,
  show_id UUID REFERENCES shows(id),
  action TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  success BOOLEAN,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent learning data
CREATE TABLE agent_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  show_id UUID REFERENCES shows(id),
  venue_name TEXT,
  venue_type TEXT,
  pattern_type TEXT,  -- email_format, response_style, typical_info_provided
  pattern_data JSONB,
  confidence NUMERIC(3,2),
  times_observed INTEGER DEFAULT 1,
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shows table extension
ALTER TABLE shows ADD COLUMN advancing_status TEXT DEFAULT 'draft';
ALTER TABLE shows ADD COLUMN advancing_started_at TIMESTAMPTZ;
ALTER TABLE shows ADD COLUMN advancing_completed_at TIMESTAMPTZ;
ALTER TABLE shows ADD COLUMN last_synced_at TIMESTAMPTZ;
ALTER TABLE shows ADD COLUMN primary_thread_id UUID REFERENCES email_threads(id);

-- Indexes for performance
CREATE INDEX idx_email_threads_show ON email_threads(show_id);
CREATE INDEX idx_email_threads_gmail ON email_threads(gmail_thread_id);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX idx_email_messages_gmail ON email_messages(gmail_message_id);
CREATE INDEX idx_agent_drafts_show ON agent_drafts(show_id);
CREATE INDEX idx_agent_drafts_status ON agent_drafts(status);
CREATE INDEX idx_email_extractions_show ON email_extractions(show_id);
CREATE INDEX idx_agent_activity_show ON agent_activity_log(show_id);
CREATE INDEX idx_agent_learning_venue ON agent_learning_data(venue_name);
```

---

## UI Components

### Draft Approval Queue

```typescript
// src/pages/DraftApprovals.tsx
export function DraftApprovals() {
  const { data: pendingDrafts } = useQuery({
    queryKey: ['agent-drafts', 'pending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_drafts')
        .select(`
          *,
          show:shows (
            venue_name,
            date,
            primary_contact
          )
        `)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true });
      return data;
    }
  });

  return (
    <div>
      <h1>Drafts Awaiting Your Review</h1>
      {pendingDrafts?.map(draft => (
        <DraftCard
          key={draft.id}
          draft={draft}
          onApprove={() => handleApproveDraft(draft.id)}
          onEdit={() => openInGmail(draft.gmail_draft_id)}
          onReject={() => handleRejectDraft(draft.id)}
        />
      ))}
    </div>
  );
}

function DraftCard({ draft, onApprove, onEdit, onReject }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {draft.show.venue_name} - {format(draft.show.date, 'MMM d, yyyy')}
        </CardTitle>
        <Badge>
          {draft.draft_type === 'initial' ? 'Initial Email' : 'Follow-up'}
        </Badge>
        <Badge variant="secondary">
          Confidence: {(draft.agent_confidence * 100).toFixed(0)}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>To:</Label>
            <p>{draft.recipients.join(', ')}</p>
          </div>
          <div>
            <Label>Subject:</Label>
            <p>{draft.subject}</p>
          </div>
          <div>
            <Label>Message:</Label>
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded">
              {draft.body}
            </pre>
          </div>
          <div>
            <Label>Questions Asked:</Label>
            <ul className="list-disc pl-4">
              {draft.questions_asked.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onApprove} variant="default">
          Approve & Send
        </Button>
        <Button onClick={onEdit} variant="outline">
          Edit in Gmail
        </Button>
        <Button onClick={onReject} variant="destructive">
          Reject & Regenerate
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Extraction Review

```typescript
// src/pages/ExtractionReview.tsx
export function ExtractionReview({ extractionId }: { extractionId: string }) {
  const { data: extraction } = useQuery({
    queryKey: ['extraction', extractionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('email_extractions')
        .select(`
          *,
          show:shows (*),
          message:email_messages (*)
        `)
        .eq('id', extractionId)
        .single();
      return data;
    }
  });

  const [edits, setEdits] = useState({});

  if (!extraction) return <Loading />;

  return (
    <div className="space-y-6">
      <h1>Review Extracted Information</h1>

      {/* Original Email */}
      <Card>
        <CardHeader>
          <CardTitle>Original Email</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap">{extraction.message.body}</pre>
        </CardContent>
      </Card>

      {/* Extracted Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Information</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(extraction.extracted_data).map(([key, field]) => (
            <ExtractionField
              key={key}
              fieldKey={key}
              field={field}
              onEdit={(value) => setEdits({ ...edits, [key]: value })}
            />
          ))}
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone:</Label>
              <Badge>{extraction.sentiment.tone}</Badge>
            </div>
            <div>
              <Label>Responsiveness:</Label>
              <Badge>{extraction.sentiment.responsiveness}</Badge>
            </div>
            <div>
              <Label>Clarity:</Label>
              <Badge>{extraction.sentiment.clarity}</Badge>
            </div>
          </div>
          {extraction.sentiment.concerns.length > 0 && (
            <Alert className="mt-4">
              <AlertTitle>Concerns Identified:</AlertTitle>
              <ul>
                {extraction.sentiment.concerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => handleApprove(extraction.id, edits)}>
          Approve {Object.keys(edits).length > 0 && '(with edits)'}
        </Button>
        <Button variant="outline" onClick={() => handleReject(extraction.id)}>
          Reject All
        </Button>
      </div>
    </div>
  );
}

function ExtractionField({ fieldKey, field, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(field.value);

  const confidenceColor =
    field.confidence > 0.9 ? 'bg-green-500' :
    field.confidence > 0.7 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="border p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <Label>{fieldKey}</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Confidence:
          </span>
          <div className={`w-20 h-2 rounded ${confidenceColor}`}
               style={{ width: `${field.confidence * 100}%` }}
          />
          <span className="text-sm">
            {(field.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {!isEditing ? (
        <div className="flex items-center justify-between">
          <span className="font-medium">{value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              onEdit(value);
              setIsEditing(false);
            }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue(field.value);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="mt-2 text-sm text-muted-foreground">
        <p><strong>Source:</strong> "{field.source_text}"</p>
        <p><strong>Reasoning:</strong> {field.reasoning}</p>
      </div>

      {field.conflict && (
        <Alert variant="destructive" className="mt-2">
          <AlertTitle>Conflict Detected</AlertTitle>
          <p>Previous value: {field.conflict.previous_value}</p>
          <p>New value: {field.conflict.new_value}</p>
        </Alert>
      )}
    </div>
  );
}
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vercel)                       │
│  - React UI for TM                                              │
│  - Draft approvals, extraction reviews, show management         │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ API calls
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Supabase)                         │
│  - PostgreSQL database                                          │
│  - Edge Functions (webhooks, API handlers)                      │
│  - Row Level Security                                           │
│  - Real-time subscriptions (for UI updates)                     │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Letta Agent Service (Docker)                  │
│  - Advancing Coordinator Agent                                  │
│  - Draft Generator Agent                                        │
│  - Email Parser Agent                                           │
│  - Sync Manager Agent                                           │
│  - Persistent memory storage                                    │
└───────────┬──────────────┬──────────────────┬───────────────────┘
            │              │                  │
            │              │                  │
            ▼              ▼                  ▼
     ┌──────────┐   ┌─────────────┐   ┌─────────────────┐
     │  Gmail   │   │ Master Tour │   │   Supabase      │
     │   API    │   │     API     │   │   Database      │
     │          │   │             │   │                 │
     └──────────┘   └─────────────┘   └─────────────────┘
```

---

## Security & Privacy

### Data Encryption
- Email content encrypted at rest in database
- Gmail API tokens encrypted using Supabase Vault
- Master Tour API keys stored securely
- Agent memory encrypted

### Access Control
- Row Level Security on all tables
- Only TM can access their tour's data
- Agents run with service role, scoped to shows
- Gmail API uses OAuth with minimal scopes

### Audit Trail
- All agent actions logged
- Email sends tracked
- Data extractions versioned
- TM approvals recorded

---

## Performance Considerations

### Async Processing
- Email parsing runs asynchronously
- Agent actions queued, processed in background
- UI updates via Supabase real-time
- No blocking operations for TM

### Caching
- Master Tour data cached locally
- Agent memory stored in Letta's optimized storage
- Email threads cached to reduce API calls

### Rate Limiting
- Gmail API: 250 quota units/user/second
- Master Tour API: No limits documented, implement conservative rate limiting
- Letta agents: No hard limits, monitor token usage

---

## Testing Strategy

### Unit Tests
- Agent function calling
- Data extraction accuracy
- Conflict resolution logic
- Sync mapping correctness

### Integration Tests
- Gmail API integration
- Master Tour API sync
- Database operations
- Webhook handling

### Agent Testing
- Prompt engineering validation
- Confidence score calibration
- Draft quality assessment
- Learning effectiveness

### User Acceptance Testing
- TM workflow walkthrough
- Draft approval process
- Extraction review UX
- Conflict resolution UI

---

## Monitoring & Observability

### Metrics to Track
- Draft approval rate (% sent without edits)
- Extraction accuracy (% correct fields)
- Time to complete advancing (compared to manual)
- Agent confidence vs. actual accuracy
- TM satisfaction scores

### Alerts
- Email processing failures
- Low confidence extractions
- Sync conflicts
- Shows nearing date with incomplete advancing

### Logging
- All agent interactions
- API calls (Gmail, Master Tour)
- Database operations
- Error stack traces

---

## Cost Estimation

### LLM Costs (via Letta)
- Draft generation: ~1000 tokens/draft @ $0.01/1K = $0.01/draft
- Email parsing: ~2000 tokens/parse @ $0.01/1K = $0.02/parse
- Average 3 email exchanges per show = ~$0.09/show
- 100 shows/year = ~$9/year LLM costs

### Infrastructure
- Letta hosting: Self-hosted (Docker) or cloud ($20-50/month)
- Supabase: Free tier or Pro ($25/month)
- Gmail API: Free
- Master Tour API: Free
- Total: ~$25-75/month

### ROI
- Time saved: ~2 hours/show @ $50/hour = $100/show
- 100 shows/year = $10,000/year saved
- System cost: ~$900/year
- **Net savings: ~$9,100/year**

---

## Conclusion

This advancing agent system represents a significant productivity multiplier for tour managers:

✅ **80%+ time savings** on advancing communication
✅ **Consistent, professional** email drafts
✅ **Automatic data extraction** with confidence scoring
✅ **Seamless sync** with Master Tour
✅ **Human-in-the-loop** safety and control
✅ **Learning system** that improves over time

The multi-agent architecture powered by Letta provides the intelligence and stateful memory needed for complex, multi-step advancing workflows while maintaining the flexibility to adapt to different venues, tours, and communication styles.
