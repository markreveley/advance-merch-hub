import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Music,
  CheckCircle2,
  Circle,
  Timer,
} from 'lucide-react';
import type { Event, AdvanceItem, GuestListEntry, SetListEntry } from '@/types/masterTour';

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [advanceItems, setAdvanceItems] = useState<AdvanceItem[]>([]);
  const [guestList, setGuestList] = useState<GuestListEntry[]>([]);
  const [setList, setSetList] = useState<SetListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails(eventId);
    }
  }, [eventId]);

  const fetchEventDetails = async (id: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual Master Tour API calls
      // Mock data for demonstration
      const mockEvent: Event = {
        id,
        day_id: 'day1',
        name: 'Main Show',
        venue: 'The Fillmore',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        advancing_status: 'in_progress',
        event_type: 'concert',
        start_time: '2025-12-01T20:00:00Z',
        end_time: '2025-12-01T23:00:00Z',
      };

      const mockAdvanceItems: AdvanceItem[] = [
        {
          id: '1',
          event_id: id,
          category: 'Technical',
          title: 'Stage Plot Confirmed',
          status: 'completed',
          completed_date: '2025-11-15T10:00:00Z',
        },
        {
          id: '2',
          event_id: id,
          category: 'Technical',
          title: 'Input List Sent',
          status: 'completed',
          completed_date: '2025-11-15T10:30:00Z',
        },
        {
          id: '3',
          event_id: id,
          category: 'Hospitality',
          title: 'Catering Requirements',
          status: 'in_progress',
          assigned_to: 'John Doe',
        },
        {
          id: '4',
          event_id: id,
          category: 'Hospitality',
          title: 'Dressing Room Setup',
          status: 'pending',
        },
        {
          id: '5',
          event_id: id,
          category: 'Production',
          title: 'Load In Time Confirmed',
          status: 'completed',
          completed_date: '2025-11-16T14:00:00Z',
        },
        {
          id: '6',
          event_id: id,
          category: 'Production',
          title: 'Soundcheck Schedule',
          status: 'in_progress',
          assigned_to: 'Jane Smith',
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      setEvent(mockEvent);
      setAdvanceItems(mockAdvanceItems);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Timer className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const calculateProgress = () => {
    if (advanceItems.length === 0) return 0;
    const completed = advanceItems.filter((item) => item.status === 'completed').length;
    return (completed / advanceItems.length) * 100;
  };

  const groupedItems = advanceItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, AdvanceItem[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => navigate('/shows')} className="mt-4">
          Back to Shows
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/shows')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shows
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{event.name || event.venue}</CardTitle>
              <CardDescription className="text-lg mt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue && <span>{event.venue} • </span>}
                  {event.city}, {event.state}
                </div>
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {event.advancing_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.start_time || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Show Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.start_time || '').toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Event Type</p>
                <p className="text-sm text-muted-foreground capitalize">{event.event_type}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Overall Progress</h3>
              <span className="text-sm text-muted-foreground">
                {advanceItems.filter((i) => i.status === 'completed').length} / {advanceItems.length}{' '}
                completed
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="advancing" className="w-full">
        <TabsList>
          <TabsTrigger value="advancing">Advancing Items</TabsTrigger>
          <TabsTrigger value="guestlist">Guest List</TabsTrigger>
          <TabsTrigger value="setlist">Set List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="advancing" className="mt-6">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>
                    {items.filter((i) => i.status === 'completed').length} of {items.length} completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            {item.assigned_to && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Assigned to: {item.assigned_to}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.status === 'completed'
                              ? 'default'
                              : item.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guestlist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest List</CardTitle>
              <CardDescription>View and manage guest list entries for this event</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Guest list integration coming soon. Will sync from Master Tour API.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setlist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Set List</CardTitle>
              <CardDescription>Performance setlist for this event</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Set list integration coming soon. Will sync from Master Tour API.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>Chronological view of advancing progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Timeline view coming soon. Will show all updates and changes to advancing items.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetail;
