import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Drafts = () => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    const { data, error } = await supabase
      .from("advancing_drafts")
      .select("*, shows(venue, show_date)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDrafts(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advancing Drafts</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Draft
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : drafts.length === 0 ? (
        <p className="text-muted-foreground">No drafts found. Generate your first advancing draft to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Show</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>AI Generated</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell>
                  {draft.shows?.venue} - {draft.shows?.show_date ? new Date(draft.shows.show_date).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell className="font-medium">{draft.draft_type}</TableCell>
                <TableCell>v{draft.version}</TableCell>
                <TableCell>{draft.ai_generated ? <Badge>AI</Badge> : <Badge variant="outline">Manual</Badge>}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{draft.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Drafts;
