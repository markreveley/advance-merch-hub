import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Phone, Trash2, Users, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ShowContactsProps {
  showId: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  is_primary: boolean;
}

const CONTACT_ROLES = [
  "Production Manager",
  "Stage Manager",
  "Promoter",
  "Talent Buyer",
  "House Manager",
  "Technical Director",
  "Other",
];

export const ShowContacts = ({ showId }: ShowContactsProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    is_primary: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    // TODO: Fetch contacts once show_contacts table is created
    // For now, show a message that the table needs to be created
    setLoading(false);
    setContacts([]);
  }, [showId]);

  const handleAddContact = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a contact name",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Feature Coming Soon",
      description: "Contact management requires the show_contacts table to be created",
    });

    // TODO: Uncomment once show_contacts table is created
    /*
    try {
      const { error } = await supabase.from("show_contacts").insert([
        {
          show_id: showId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role || null,
          is_primary: formData.is_primary,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact added",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        is_primary: false,
      });
      setDialogOpen(false);
      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      });
    }
    */
  };

  const handleDeleteContact = async (contactId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Contact management requires the show_contacts table to be created",
    });

    // TODO: Uncomment once show_contacts table is created
    /*
    try {
      const { error } = await supabase
        .from("show_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted",
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    }
    */
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Venue Contacts
            </CardTitle>
            <CardDescription>
              Production managers, stage managers, and other contacts
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              No contacts added yet. Add venue contacts to track who you're working with.
            </p>
            <p className="text-xs text-amber-600">
              Note: Requires show_contacts table to be created in database
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-background"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{contact.name}</p>
                    {contact.is_primary && (
                      <Badge variant="default" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                    {contact.role && (
                      <Badge variant="outline" className="text-xs">
                        {contact.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${contact.email}`} className="hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>Add a venue contact for this show</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@venue.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No role</SelectItem>
                    {CONTACT_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_primary: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_primary"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Primary contact
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddContact}>Add Contact</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
