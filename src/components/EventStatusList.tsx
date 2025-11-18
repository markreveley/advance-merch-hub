import { useState, useEffect } from 'react';
import { EventStatusCard } from './EventStatusCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { Event, EventStatusSummary } from '@/types/masterTour';

interface EventStatusListProps {
  tourId?: string;
  dayId?: string;
  onEventClick?: (event: Event) => void;
}

/**
 * EventStatusList Component
 *
 * Displays a list of events from Master Tour with their advancing status.
 * Can be filtered by tour or day.
 */
export function EventStatusList({ tourId, dayId, onEventClick }: EventStatusListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [tourId, dayId]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual Master Tour API call
      // For now, using mock data
      const mockEvents: Event[] = [
        {
          id: '1',
          day_id: dayId || 'day1',
          name: 'Main Show',
          venue: 'The Fillmore',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          advancing_status: 'in_progress',
          event_type: 'concert',
          start_time: '2025-12-01T20:00:00Z',
        },
        {
          id: '2',
          day_id: dayId || 'day2',
          name: 'Soundcheck',
          venue: 'The Fillmore',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          advancing_status: 'completed',
          event_type: 'soundcheck',
          start_time: '2025-12-01T16:00:00Z',
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      setEvents(mockEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (events.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No events found. Events will appear here once synced from Master Tour.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventStatusCard
          key={event.id}
          event={event}
          statusSummary={{
            event,
            advance_items_total: 10,
            advance_items_completed: 6,
            advance_items_pending: 2,
            advance_items_in_progress: 2,
            last_updated: new Date().toISOString(),
          }}
          onClick={() => onEventClick?.(event)}
        />
      ))}
    </div>
  );
}

export default EventStatusList;
