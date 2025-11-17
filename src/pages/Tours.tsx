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

interface Tour {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

const Tours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [deletingTour, setDeletingTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    status: "planning",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .order("start_date", { ascending: false });

    if (!error && data) {
      setTours(data);
    }
    setLoading(false);
  };

  const handleOpenDialog = (tour?: Tour) => {
    if (tour) {
      setEditingTour(tour);
      setFormData({
        name: tour.name,
        start_date: tour.start_date,
        end_date: tour.end_date,
        status: tour.status,
      });
    } else {
      setEditingTour(null);
      setFormData({ name: "", start_date: "", end_date: "", status: "planning" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTour(null);
    setFormData({ name: "", start_date: "", end_date: "", status: "planning" });
  };

  const handleSave = async () => {
    try {
      const tourData = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
      };

      if (editingTour) {
        const { error } = await supabase
          .from("tours")
          .update(tourData)
          .eq("id", editingTour.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tour updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("tours")
          .insert([tourData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tour created successfully",
        });
      }

      handleCloseDialog();
      fetchTours();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tour",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTour) return;

    try {
      const { error } = await supabase
        .from("tours")
        .delete()
        .eq("id", deletingTour.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tour deleted successfully",
      });

      setDeleteDialogOpen(false);
      setDeletingTour(null);
      fetchTours();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tour",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tours</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tour
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tours.length === 0 ? (
        <p className="text-muted-foreground">No tours found. Create your first tour to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell className="font-medium">{tour.name}</TableCell>
                <TableCell>{tour.start_date ? new Date(tour.start_date).toLocaleDateString() : "N/A"}</TableCell>
                <TableCell>{tour.end_date ? new Date(tour.end_date).toLocaleDateString() : "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(tour.status)}>{tour.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(tour)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingTour(tour);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTour ? "Edit Tour" : "Add Tour"}</DialogTitle>
            <DialogDescription>
              {editingTour ? "Update tour details below" : "Enter tour details below"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tour Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Spring Tour 2025"
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTour ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tour "{deletingTour?.name}" and all associated shows.
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

export default Tours;
