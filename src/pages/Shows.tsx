import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Grid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EventStatusList } from "@/components/EventStatusList";
import type { Event } from "@/types/masterTour";
import type { Tour } from "@/types/advancing";

const Shows = () => {
  const [shows, setShows] = useState<any[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tour_id: "",
    venue: "",
    show_date: "",
    city: "",
    state: "",
    country: "USA",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchShows();
    fetchTours();
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

  const fetchTours = async () => {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .order("start_date", { ascending: false });

    if (!error && data) {
      setTours(data);
    }
  };

  const handleAddShow = async () => {
    if (!formData.venue.trim() || !formData.show_date) {
      toast({
        title: "Error",
        description: "Please enter venue name and show date",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shows")
        .insert([
          {
            tour_id: formData.tour_id || null,
            venue: formData.venue,
            show_date: formData.show_date,
            city: formData.city || null,
            state: formData.state || null,
            country: formData.country || "USA",
            advancing_status: "not_started",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Show created successfully",
      });

      setFormData({
        tour_id: "",
        venue: "",
        show_date: "",
        city: "",
        state: "",
        country: "USA",
      });
      setDialogOpen(false);
      fetchShows();

      // Navigate to the newly created show
      if (data) {
        navigate(`/shows/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create show",
        variant: "destructive",
      });
    }
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
          <Button onClick={() => setDialogOpen(true)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Show</DialogTitle>
            <DialogDescription>Create a new show and start advancing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tour_id">Tour (Optional)</Label>
              <Select
                value={formData.tour_id}
                onValueChange={(value) => setFormData({ ...formData, tour_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tour or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Tour</SelectItem>
                  {tours.map((tour) => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue">Venue Name *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="The Ritz"
                />
              </div>
              <div>
                <Label htmlFor="show_date">Show Date *</Label>
                <Input
                  id="show_date"
                  type="date"
                  value={formData.show_date}
                  onChange={(e) => setFormData({ ...formData, show_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Austin"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="TX"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddShow}>Create Show</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shows;
