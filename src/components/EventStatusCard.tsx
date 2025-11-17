import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Music, Users } from "lucide-react";
import type { Event, EventStatusSummary } from "@/types/masterTour";

interface EventStatusCardProps {
  event: Event;
  statusSummary?: EventStatusSummary;
  onClick?: () => void;
}

/**
 * EventStatusCard Component
 *
 * Displays the current status of an event from Master Tour,
 * including advancing progress, location, and key details.
 */
export function EventStatusCard({ event, statusSummary, onClick }: EventStatusCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'default';
      case 'in_progress':
      case 'advancing':
        return 'secondary';
      case 'pending':
      case 'not_started':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const calculateProgress = () => {
    if (!statusSummary) return 0;
    const total = statusSummary.advance_items_total;
    if (total === 0) return 0;
    return (statusSummary.advance_items_completed / total) * 100;
  };

  const progress = calculateProgress();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {event.name || event.venue || 'Untitled Event'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.city && event.state
                ? `${event.city}, ${event.state}`
                : event.city || event.state || 'Location TBD'}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(event.advancing_status)}>
            {event.advancing_status || 'Not Started'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {event.start_time && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {new Date(event.start_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          {event.event_type && (
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{event.event_type}</span>
            </div>
          )}
        </div>

        {statusSummary && statusSummary.advance_items_total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Advancing Progress</span>
              <span className="font-medium">
                {statusSummary.advance_items_completed} / {statusSummary.advance_items_total}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>✓ {statusSummary.advance_items_completed} Completed</span>
              <span>⏳ {statusSummary.advance_items_in_progress} In Progress</span>
              <span>○ {statusSummary.advance_items_pending} Pending</span>
            </div>
          </div>
        )}

        {statusSummary?.last_updated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(statusSummary.last_updated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventStatusCard;
