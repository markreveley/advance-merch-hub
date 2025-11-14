import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Shows = () => {
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shows</h1>
        <Button>
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
                <TableCell>{show.tours?.name || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{show.advancing_status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Shows;
