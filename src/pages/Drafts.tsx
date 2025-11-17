import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Draft {
  id: string;
  show_id: string | null;
  draft_type: string;
  content: string;
  ai_generated: boolean;
  version: number;
  status: string;
  shows?: {
    venue: string;
    show_date: string;
  };
}

interface Show {
  id: string;
  venue: string;
  show_date: string;
}

const Drafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [viewingDraft, setViewingDraft] = useState<Draft | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<Draft | null>(null);
  const [formData, setFormData] = useState({
    show_id: "",
    draft_type: "rider",
    content: "",
    ai_generated: false,
    version: "1",
    status: "draft",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDrafts();
    fetchShows();
  }, []);

  const fetchDrafts = async () => {
    const { data, error } = await supabase
      .from("advancing_drafts")
      .select("*, shows(venue, show_date)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDrafts(data as Draft[]);
    }
    setLoading(false);
  };

  const fetchShows = async () => {
    const { data, error } = await supabase
      .from("shows")
      .select("id, venue, show_date")
      .order("show_date", { ascending: false });

    if (!error && data) {
      setShows(data);
    }
  };

  const handleOpenDialog = (draft?: Draft) => {
    if (draft) {
      setEditingDraft(draft);
      setFormData({
        show_id: draft.show_id || "",
        draft_type: draft.draft_type,
        content: draft.content,
        ai_generated: draft.ai_generated,
        version: draft.version.toString(),
        status: draft.status,
      });
    } else {
      setEditingDraft(null);
      setFormData({
        show_id: "",
        draft_type: "rider",
        content: "",
        ai_generated: false,
        version: "1",
        status: "draft",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDraft(null);
    setFormData({
      show_id: "",
      draft_type: "rider",
      content: "",
      ai_generated: false,
      version: "1",
      status: "draft",
    });
  };

  const handleView = (draft: Draft) => {
    setViewingDraft(draft);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const draftData = {
        show_id: formData.show_id || null,
        draft_type: formData.draft_type,
        content: formData.content,
        ai_generated: formData.ai_generated,
        version: parseInt(formData.version),
        status: formData.status,
      };

      if (editingDraft) {
        const { error } = await supabase
          .from("advancing_drafts")
          .update(draftData)
          .eq("id", editingDraft.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Draft updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("advancing_drafts")
          .insert([draftData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Draft created successfully",
        });
      }

      handleCloseDialog();
      fetchDrafts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingDraft) return;

    try {
      const { error } = await supabase
        .from("advancing_drafts")
        .delete()
        .eq("id", deletingDraft.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });

      setDeleteDialogOpen(false);
      setDeletingDraft(null);
      fetchDrafts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete draft",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "sent":
        return "secondary";
      case "review":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advancing Drafts</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Draft
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : drafts.length === 0 ? (
        <p className="text-muted-foreground">No drafts found. Create your first advancing draft to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Show</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell>
                  {draft.shows?.venue || "No show"} -{" "}
                  {draft.shows?.show_date ? new Date(draft.shows.show_date).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell className="font-medium">{draft.draft_type}</TableCell>
                <TableCell>v{draft.version}</TableCell>
                <TableCell>
                  {draft.ai_generated ? <Badge>AI</Badge> : <Badge variant="outline">Manual</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(draft.status)}>{draft.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleView(draft)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(draft)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingDraft(draft);
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDraft ? "Edit Draft" : "Create Draft"}</DialogTitle>
            <DialogDescription>
              {editingDraft ? "Update draft details below" : "Enter draft details below"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="show_id">Show (Optional)</Label>
                <Select
                  value={formData.show_id}
                  onValueChange={(value) => setFormData({ ...formData, show_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select show" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Show</SelectItem>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        {show.venue} - {new Date(show.show_date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="draft_type">Draft Type</Label>
                <Select
                  value={formData.draft_type}
                  onValueChange={(value) => setFormData({ ...formData, draft_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rider">Rider</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="tech">Technical Specs</SelectItem>
                    <SelectItem value="stage_plot">Stage Plot</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  type="number"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter advancing document content..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingDraft ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>View Draft</DialogTitle>
            <DialogDescription>
              {viewingDraft?.draft_type} - Version {viewingDraft?.version}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted" className="max-h-[60vh] overflow-y-auto">
              <div className="prose dark:prose-invert max-w-none p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap">{viewingDraft?.content}</pre>
              </div>
            </TabsContent>
            <TabsContent value="raw" className="max-h-[60vh] overflow-y-auto">
              <Textarea
                value={viewingDraft?.content || ""}
                readOnly
                rows={20}
                className="font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setViewDialogOpen(false);
                if (viewingDraft) {
                  handleOpenDialog(viewingDraft);
                }
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deletingDraft?.draft_type} draft (v
              {deletingDraft?.version}). This action cannot be undone.
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

export default Drafts;
