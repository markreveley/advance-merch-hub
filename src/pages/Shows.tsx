import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Show {
  id: string;
  tour_id: string | null;
  show_date: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  master_tour_id: string | null;
  advancing_status: string;
  tours?: {
    name: string;
  };
}

interface Tour {
  id: string;
  name: string;
}

const Shows = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [deletingShow, setDeletingShow] = useState<Show | null>(null);
  const [formData, setFormData] = useState({
    tour_id: "",
    show_date: "",
    venue: "",
    city: "",
    state: "",
    country: "USA",
    master_tour_id: "",
    advancing_status: "not_started",
  });
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
      setShows(data as Show[]);
    }
    setLoading(false);
  };

  const fetchTours = async () => {
    const { data, error } = await supabase
      .from("tours")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setTours(data);
    }
  };

  const handleOpenDialog = (show?: Show) => {
    if (show) {
      setEditingShow(show);
      setFormData({
        tour_id: show.tour_id || "",
        show_date: show.show_date,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country,
        master_tour_id: show.master_tour_id || "",
        advancing_status: show.advancing_status,
      });
    } else {
      setEditingShow(null);
      setFormData({
        tour_id: "",
        show_date: "",
        venue: "",
        city: "",
        state: "",
        country: "USA",
        master_tour_id: "",
        advancing_status: "not_started",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingShow(null);
    setFormData({
      tour_id: "",
      show_date: "",
      venue: "",
      city: "",
      state: "",
      country: "USA",
      master_tour_id: "",
      advancing_status: "not_started",
    });
  };

  const handleSave = async () => {
    try {
      const showData = {
        tour_id: formData.tour_id || null,
        show_date: formData.show_date,
        venue: formData.venue,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        master_tour_id: formData.master_tour_id || null,
        advancing_status: formData.advancing_status,
      };

      if (editingShow) {
        const { error } = await supabase
          .from("shows")
          .update(showData)
          .eq("id", editingShow.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Show updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("shows")
          .insert([showData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Show created successfully",
        });
      }

      handleCloseDialog();
      fetchShows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save show",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingShow) return;

    try {
      const { error } = await supabase
        .from("shows")
        .delete()
        .eq("id", deletingShow.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Show deleted successfully",
      });

      setDeleteDialogOpen(false);
      setDeletingShow(null);
      fetchShows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete show",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shows</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Show
        </Button>
      </div>

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shows.map((show) => (
              <TableRow key={show.id}>
                <TableCell>{new Date(show.show_date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{show.venue}</TableCell>
                <TableCell>
                  {show.city}, {show.state}
                </TableCell>
                <TableCell>{show.tours?.name || "No tour"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(show.advancing_status)}>{show.advancing_status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(show)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingShow(show);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShow ? "Edit Show" : "Add Show"}</DialogTitle>
            <DialogDescription>
              {editingShow ? "Update show details below" : "Enter show details below"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="show_date">Show Date</Label>
                <Input
                  id="show_date"
                  type="date"
                  value={formData.show_date}
                  onChange={(e) => setFormData({ ...formData, show_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tour_id">Tour (Optional)</Label>
                <Select
                  value={formData.tour_id}
                  onValueChange={(value) => setFormData({ ...formData, tour_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tour" />
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
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Red Rocks Amphitheatre"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Morrison"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="CO"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                />
              </div>
              <div>
                <Label htmlFor="advancing_status">Advancing Status</Label>
                <Select
                  value={formData.advancing_status}
                  onValueChange={(value) => setFormData({ ...formData, advancing_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="master_tour_id">Master Tour ID (Optional)</Label>
              <Input
                id="master_tour_id"
                value={formData.master_tour_id}
                onChange={(e) => setFormData({ ...formData, master_tour_id: e.target.value })}
                placeholder="External Master Tour ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingShow ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the show "{deletingShow?.venue}" on{" "}
              {deletingShow?.show_date ? new Date(deletingShow.show_date).toLocaleDateString() : ""}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shows;
