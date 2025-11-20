import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdvancingChecklist as ChecklistItem } from "@/types/advancing";

interface AdvancingChecklistProps {
  showId: string;
}

const CATEGORIES = [
  { value: "schedule", label: "Schedule" },
  { value: "technical", label: "Technical" },
  { value: "hospitality", label: "Hospitality" },
  { value: "financial", label: "Financial" },
  { value: "contacts", label: "Contacts" },
  { value: "logistics", label: "Logistics" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "secondary" },
  { value: "medium", label: "Medium", color: "default" },
  { value: "high", label: "High", color: "destructive" },
];

export const AdvancingChecklist = ({ showId }: AdvancingChecklistProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    checklist_item: "",
    category: "",
    priority: "medium" as const,
    due_date: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchChecklist();
  }, [showId]);

  const fetchChecklist = async () => {
    const { data, error } = await supabase
      .from("advancing_checklists")
      .select("*")
      .eq("show_id", showId)
      .order("completed", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!formData.checklist_item.trim()) {
      toast({
        title: "Error",
        description: "Please enter a checklist item",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("advancing_checklists").insert([
        {
          show_id: showId,
          checklist_item: formData.checklist_item,
          category: formData.category || null,
          priority: formData.priority,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
          completed: false,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Checklist item added",
      });

      setFormData({
        checklist_item: "",
        category: "",
        priority: "medium",
        due_date: "",
        notes: "",
      });
      setDialogOpen(false);
      fetchChecklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from("advancing_checklists")
        .update({
          completed: !item.completed,
          completed_at: !item.completed ? new Date().toISOString() : null,
        })
        .eq("id", item.id);

      if (error) throw error;

      fetchChecklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("advancing_checklists")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Checklist item deleted",
      });

      fetchChecklist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return p?.color || "secondary";
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return null;
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading checklist...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Advancing Checklist
            </CardTitle>
            <CardDescription>
              Track progress on advancing tasks ({completedCount}/{totalCount} completed • {progress}%)
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No checklist items yet. Add items to track your advancing progress.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.completed ? "bg-muted/50" : "bg-background"
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleComplete(item)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`font-medium ${
                        item.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.checklist_item}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    )}
                    <Badge variant={getPriorityColor(item.priority) as any} className="text-xs">
                      {item.priority}
                    </Badge>
                    {item.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground">{item.notes}</p>
                  )}
                  {item.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {new Date(item.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Checklist Item</DialogTitle>
              <DialogDescription>Add a new item to track advancing progress</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="checklist_item">Task</Label>
                <Input
                  id="checklist_item"
                  value={formData.checklist_item}
                  onChange={(e) =>
                    setFormData({ ...formData, checklist_item: e.target.value })
                  }
                  placeholder="Confirm load-in time"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
