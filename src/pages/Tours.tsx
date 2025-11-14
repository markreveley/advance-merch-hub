import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Tours = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tours</h1>
        <Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell className="font-medium">{tour.name}</TableCell>
                <TableCell>{tour.start_date ? new Date(tour.start_date).toLocaleDateString() : "N/A"}</TableCell>
                <TableCell>{tour.end_date ? new Date(tour.end_date).toLocaleDateString() : "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{tour.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Tours;
