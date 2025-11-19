// Advancing System Type Definitions
// Generated from database schema - see supabase/migrations/

/**
 * Tour represents a complete tour (e.g., "Spring 2025 Tour")
 */
export interface Tour {
  id: string;
  name: string;
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  status?: 'planning' | 'active' | 'completed';
  // Added by migration
  master_tour_id?: string | null;
  artist?: string | null;
  tour_manager_name?: string | null;
  tour_manager_email?: string | null;
  tour_manager_phone?: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

/**
 * Show represents a single tour date/performance
 */
export interface Show {
  id: string;
  tour_id?: string | null;

  // Basic info (original schema)
  show_date: string; // ISO date
  venue: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  master_tour_id?: string | null;
  advancing_status?: 'not_started' | 'in_progress' | 'completed' | 'stalled';

  // Added by migration
  stage_info?: string | null;
  capacity?: number | null;
  doors_time?: string | null; // TIME format
  show_time?: string | null; // TIME format
  load_in_time?: string | null; // TIME format
  settlement_currency?: string | null;
  merch_split_percentage?: number | null; // Decimal e.g., 85.00 for 85%
  notes?: string | null;
  master_tour_sync_status?: 'not_synced' | 'synced' | 'error' | null;
  last_synced_at?: string | null; // ISO datetime
  primary_thread_id?: string | null;

  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

/**
 * Email thread associated with a show's advancing process
 */
export interface EmailThread {
  id: string;
  show_id: string;
  subject: string;
  thread_status: 'active' | 'completed' | 'stalled';
  last_message_at: string; // ISO datetime
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

/**
 * Individual email message within a thread
 */
export interface EmailMessage {
  id: string;
  thread_id: string;
  sender_email: string;
  sender_name?: string | null;
  recipient_emails: string[];
  cc_emails?: string[] | null;
  subject: string;
  body_text?: string | null;
  body_html?: string | null;
  sent_at: string; // ISO datetime
  is_from_venue: boolean;
  is_from_agent: boolean;
  message_type: 'email' | 'sms' | 'phone_note';
  created_at: string; // ISO datetime
}

/**
 * Contact information for a show
 */
export interface ShowContact {
  id: string;
  show_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null; // e.g., "Production Manager", "Stage Manager"
  is_primary: boolean;
  created_at: string; // ISO datetime
}

/**
 * AI-generated draft for review (from Letta agents)
 */
export interface AgentDraft {
  id: string;
  show_id: string;
  draft_type: string; // 'advancing_email', 'followup', 'rider', etc.
  content?: string | null;
  status: 'pending_review' | 'approved' | 'rejected' | 'sent';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  sent_at?: string | null;
  ai_model?: string | null;
  ai_confidence_score?: number | null; // 0.00-1.00
  created_at: string;
  updated_at: string;
}

/**
 * Data extracted from venue emails by AI
 */
export interface EmailExtraction {
  id: string;
  email_message_id: string;
  extraction_type: string; // 'schedule', 'contact', 'technical', etc.
  extracted_data?: Record<string, any> | null; // JSONB
  confidence_score?: number | null; // 0.00-1.00
  needs_review: boolean;
  reviewed: boolean;
  created_at: string;
}

/**
 * Log of AI agent activities
 */
export interface AgentActivityLog {
  id: string;
  show_id?: string | null;
  activity_type: string; // 'draft_created', 'email_parsed', 'sync_completed', etc.
  activity_description?: string | null;
  metadata?: Record<string, any> | null; // JSONB
  success: boolean;
  error_message?: string | null;
  created_at: string;
}

/**
 * AI learning data for improving performance
 */
export interface AgentLearningData {
  id: string;
  venue_id?: string | null;
  venue_name?: string | null;
  pattern_type: string; // 'response_time', 'preferred_format', etc.
  pattern_data?: Record<string, any> | null; // JSONB
  success_rate?: number | null; // Decimal
  sample_size: number;
  last_updated: string;
  created_at: string;
}

/**
 * Email and document templates
 */
export interface AdvancingTemplate {
  id: string;
  template_name: string;
  template_type: string; // 'email', 'rider', 'hospitality', etc.
  template_content?: string | null;
  variables?: Record<string, any> | null; // JSONB
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Checklist items for advancing progress
 */
export interface AdvancingChecklist {
  id: string;
  show_id: string;
  checklist_item: string;
  category?: string | null; // 'schedule', 'technical', 'hospitality', etc.
  completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
  due_date?: string | null; // ISO date
  priority: 'low' | 'medium' | 'high';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Master Tour API sync log
 */
export interface MasterTourSyncLog {
  id: string;
  sync_type: string; // 'full', 'incremental', 'single_show'
  sync_status: 'running' | 'completed' | 'failed';
  shows_synced: number;
  shows_created: number;
  shows_updated: number;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

/**
 * Cache for Master Tour API data
 */
export interface MasterTourCache {
  id: string;
  master_tour_id: string;
  cache_key: string;
  cache_data?: Record<string, any> | null; // JSONB
  expires_at?: string | null;
  created_at: string;
}

/**
 * Advancing draft (original table for manually created docs)
 */
export interface AdvancingDraft {
  id: string;
  show_id: string;
  draft_type: string; // 'rider', 'hospitality', 'tech', 'stage_plot', etc.
  content?: string | null;
  ai_generated: boolean;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'sent';
  created_at: string;
  updated_at: string;
}

// Input types for forms (subset of full types without auto-generated fields)

export interface TourInput {
  name: string;
  artist: string;
  tour_manager_name?: string;
  tour_manager_email?: string;
  tour_manager_phone?: string;
  start_date?: string;
  end_date?: string;
  status?: 'planning' | 'active' | 'completed';
  master_tour_id?: string;
}

export interface ShowInput {
  tour_id?: string;
  show_date: string;
  venue: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  stage_info?: string;
  load_in_time?: string;
  doors_time?: string;
  show_time?: string;
  settlement_currency?: string;
  merch_split_percentage?: number;
  notes?: string;
  master_tour_id?: string;
}

export interface ShowContactInput {
  show_id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
}

// View types for UI display (with relationships)

export interface ShowWithTour extends Show {
  tour: Tour;
}

export interface ShowWithDetails extends Show {
  tour: Tour;
  contacts: ShowContact[];
  email_threads: EmailThread[];
}

export interface TourWithShows extends Tour {
  shows: Show[];
  show_count: number;
}

// Utility types

export type AdvancingStatus = 'not_started' | 'in_progress' | 'completed' | 'stalled';
export type ThreadStatus = 'active' | 'completed' | 'stalled';
export type TourStatus = 'planning' | 'active' | 'completed';
export type MessageType = 'email' | 'sms' | 'phone_note';
export type MasterTourSyncStatus = 'not_synced' | 'synced' | 'error';
