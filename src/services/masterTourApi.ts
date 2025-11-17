import type {
  MasterTourApiResponse,
  Tour,
  Event,
  GuestListEntry,
  SetListEntry,
  CrewMember,
  MasterTourConfig,
} from '@/types/masterTour';

/**
 * Master Tour (Eventric) API Service
 *
 * This service provides integration with the Master Tour API for tour management,
 * event advancing, guest lists, and set lists.
 *
 * API Documentation: https://my.eventric.com/portal/apidocs
 *
 * Authentication: OAuth 1.0 with public/private keypairs
 *
 * Note: OAuth 1.0 signature generation requires server-side implementation
 * for security. This client assumes a backend proxy is available.
 */

class MasterTourApiService {
  private config: MasterTourConfig;
  private baseUrl: string;

  constructor(config?: Partial<MasterTourConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || import.meta.env.VITE_MASTER_TOUR_API_URL || 'https://my.eventric.com',
      publicKey: config?.publicKey || import.meta.env.VITE_MASTER_TOUR_PUBLIC_KEY,
      privateKey: config?.privateKey || import.meta.env.VITE_MASTER_TOUR_PRIVATE_KEY,
    };
    this.baseUrl = this.config.baseUrl;
  }

  /**
   * Makes an authenticated request to the Master Tour API
   *
   * Note: In production, this should proxy through a backend service
   * that handles OAuth 1.0 signature generation securely.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<MasterTourApiResponse<T>> {
    try {
      // TODO: Implement OAuth 1.0 signature or proxy through backend
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          // OAuth headers would be added here
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data as MasterTourApiResponse<T>;
    } catch (error) {
      console.error('Master Tour API Error:', error);
      throw error;
    }
  }

  /**
   * Get all tours the user has access to
   */
  async getTours(): Promise<Tour[]> {
    const response = await this.request<Tour[]>('/api/v5/tours');
    return response.data || [];
  }

  /**
   * Get a specific tour with its dates
   */
  async getTour(tourId: string): Promise<Tour> {
    const response = await this.request<Tour>(`/api/v5/tour/${tourId}`);
    return response.data;
  }

  /**
   * Get crew members assigned to a tour
   */
  async getTourCrew(tourId: string): Promise<CrewMember[]> {
    const response = await this.request<CrewMember[]>(`/api/v5/tour/${tourId}/crew`);
    return response.data || [];
  }

  /**
   * Get events for a specific day
   */
  async getDayEvents(dayId: string): Promise<Event[]> {
    const response = await this.request<Event[]>(`/api/v5/day/${dayId}/events`);
    return response.data || [];
  }

  /**
   * Get guest list for an event
   */
  async getEventGuestList(eventId: string): Promise<GuestListEntry[]> {
    const response = await this.request<GuestListEntry[]>(`/api/v5/event/${eventId}/guestlist`);
    return response.data || [];
  }

  /**
   * Get set list for an event
   */
  async getEventSetList(eventId: string): Promise<SetListEntry[]> {
    const response = await this.request<SetListEntry[]>(`/api/v5/event/${eventId}/setlist`);
    return response.data || [];
  }

  /**
   * Mock method to get event advancing status
   *
   * Note: The API documentation doesn't show a specific endpoint for
   * advancing status, so this would need to be implemented based on
   * the actual API or using itinerary items.
   */
  async getEventAdvancingStatus(eventId: string): Promise<any> {
    // This is a placeholder - actual implementation would depend on
    // how Master Tour structures advancing data
    console.warn('getEventAdvancingStatus not yet implemented');
    return {
      event_id: eventId,
      status: 'pending',
      items: [],
    };
  }
}

// Export singleton instance
export const masterTourApi = new MasterTourApiService();

// Export class for testing/custom instances
export default MasterTourApiService;
