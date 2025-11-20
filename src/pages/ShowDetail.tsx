import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar, MapPin, Clock, DollarSign, Users, CheckSquare } from "lucide-react";
import type { Show, Tour } from "@/types/advancing";
import { AdvancingChecklist } from "@/components/advancing/AdvancingChecklist";
import { ShowContacts } from "@/components/advancing/ShowContacts";

interface ShowWithTour extends Show {
  tours?: Tour;
}

const ShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState<ShowWithTour | null>(null);
  const [formData, setFormData] = useState({
    venue: "",
    show_date: "",
    city: "",
    state: "",
    country: "USA",
    capacity: "",
    stage_info: "",
    load_in_time: "",
    doors_time: "",
    show_time: "",
    settlement_currency: "USD",
    merch_split_percentage: "",
    notes: "",
    advancing_status: "not_started" as const,
  });

  useEffect(() => {
    if (id) {
      fetchShow();
    }
  }, [id]);

  const fetchShow = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("shows")
      .select("*, tours(*)")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load show details",
        variant: "destructive",
      });
      navigate("/shows");
      return;
    }

    if (data) {
      setShow(data as ShowWithTour);
      setFormData({
        venue: data.venue || "",
        show_date: data.show_date || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "USA",
        capacity: data.capacity?.toString() || "",
        stage_info: data.stage_info || "",
        load_in_time: data.load_in_time || "",
        doors_time: data.doors_time || "",
        show_time: data.show_time || "",
        settlement_currency: data.settlement_currency || "USD",
        merch_split_percentage: data.merch_split_percentage?.toString() || "",
        notes: data.notes || "",
        advancing_status: data.advancing_status || "not_started",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const updateData = {
        venue: formData.venue,
        show_date: formData.show_date,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || "USA",
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        stage_info: formData.stage_info || null,
        load_in_time: formData.load_in_time || null,
        doors_time: formData.doors_time || null,
        show_time: formData.show_time || null,
        settlement_currency: formData.settlement_currency || null,
        merch_split_percentage: formData.merch_split_percentage
          ? parseFloat(formData.merch_split_percentage)
          : null,
        notes: formData.notes || null,
        advancing_status: formData.advancing_status,
      };

      const { error } = await supabase
        .from("shows")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Show updated successfully",
      });

      fetchShow(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update show",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "stalled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading show details...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Show not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/shows")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{formData.venue}</h1>
            <p className="text-muted-foreground">
              {show.tours?.name || "No Tour"} • {new Date(formData.show_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(formData.advancing_status)}>
            {formData.advancing_status.replace("_", " ")}
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Show Information
              </CardTitle>
              <CardDescription>Basic details about this show</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venue">Venue Name</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="The Ritz"
                  />
                </div>
                <div>
                  <Label htmlFor="show_date">Show Date</Label>
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

              <div>
                <Label htmlFor="advancing_status">Advancing Status</Label>
                <Select
                  value={formData.advancing_status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, advancing_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="stalled">Stalled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this show..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Show Schedule
              </CardTitle>
              <CardDescription>Load-in, doors, and show times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="load_in_time">Load-In Time</Label>
                  <Input
                    id="load_in_time"
                    type="time"
                    value={formData.load_in_time}
                    onChange={(e) => setFormData({ ...formData, load_in_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doors_time">Doors Time</Label>
                  <Input
                    id="doors_time"
                    type="time"
                    value={formData.doors_time}
                    onChange={(e) => setFormData({ ...formData, doors_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="show_time">Show Time</Label>
                  <Input
                    id="show_time"
                    type="time"
                    value={formData.show_time}
                    onChange={(e) => setFormData({ ...formData, show_time: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Information</CardTitle>
              <CardDescription>Stage specs and venue capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Venue Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stage_info">Stage Information</Label>
                <Textarea
                  id="stage_info"
                  value={formData.stage_info}
                  onChange={(e) => setFormData({ ...formData, stage_info: e.target.value })}
                  placeholder="Stage dimensions, PA system specs, backline, etc..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
              <CardDescription>Settlement and merch split information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="settlement_currency">Settlement Currency</Label>
                  <Select
                    value={formData.settlement_currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, settlement_currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="merch_split">Merch Split %</Label>
                  <Input
                    id="merch_split"
                    type="number"
                    step="0.01"
                    value={formData.merch_split_percentage}
                    onChange={(e) =>
                      setFormData({ ...formData, merch_split_percentage: e.target.value })
                    }
                    placeholder="85.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Artist's percentage of merch sales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          {id && <ShowContacts showId={id} />}
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          {id && <AdvancingChecklist showId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShowDetail;
