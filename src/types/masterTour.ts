// Master Tour (Eventric) API Types

export interface MasterTourApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface Tour {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface Day {
  id: string;
  tour_id: string;
  date: string;
}

export interface Event {
  id: string;
  day_id: string;
  name: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  advancing_status?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
}

export interface AdvanceItem {
  id: string;
  event_id: string;
  category: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  notes?: string;
}

export interface GuestListEntry {
  id: string;
  event_id: string;
  name: string;
  guest_count: number;
  status: string;
  notes?: string;
}

export interface SetListEntry {
  id: string;
  event_id: string;
  song_name: string;
  song_order: number;
  duration?: number;
  notes?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface MasterTourConfig {
  baseUrl: string;
  publicKey?: string;
  privateKey?: string;
}

export interface EventStatusSummary {
  event: Event;
  advance_items_total: number;
  advance_items_completed: number;
  advance_items_pending: number;
  advance_items_in_progress: number;
  last_updated?: string;
}
