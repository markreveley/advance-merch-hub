import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Grid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EventStatusList } from "@/components/EventStatusList";
import type { Event } from "@/types/masterTour";

const Shows = () => {
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const navigate = useNavigate();

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    const { data, error } = await supabase
      .from("shows")
      .select("*, tours(name)")
      .order("show_date", { ascending: false });

    if (!error && data) {
      setShows(data);
    }
    setLoading(false);
  };

  const handleEventClick = (event: Event) => {
    navigate(`/shows/${event.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shows</h1>
          <p className="text-muted-foreground mt-1">
            View and manage show advancing status from Master Tour
          </p>
        </div>
        <div className="flex gap-2">
          <div className="border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Show
          </Button>
        </div>
      </div>

      <Tabs defaultValue="master-tour" className="w-full">
        <TabsList>
          <TabsTrigger value="master-tour">Master Tour Events</TabsTrigger>
          <TabsTrigger value="database">Database Shows</TabsTrigger>
        </TabsList>

        <TabsContent value="master-tour" className="mt-6">
          {viewMode === 'grid' ? (
            <EventStatusList onEventClick={handleEventClick} />
          ) : (
            <div className="text-muted-foreground">
              List view for Master Tour events coming soon...
            </div>
          )}
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          {loading ? (
            <p>Loading...</p>
          ) : shows.length === 0 ? (
            <p className="text-muted-foreground">No shows found. Add your first show to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Advancing Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shows.map((show) => (
                  <TableRow
                    key={show.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/shows/${show.id}`)}
                  >
                    <TableCell>{new Date(show.show_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{show.venue}</TableCell>
                    <TableCell>
                      {show.city}, {show.state}
                    </TableCell>
                    <TableCell>{show.tours?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{show.advancing_status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Shows;
