import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Inventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*, products(name, sku)")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setInventory(data);
    }
    setLoading(false);
  };

  const getStockLevel = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity < 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Inventory
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : inventory.length === 0 ? (
        <p className="text-muted-foreground">No inventory records found. Add inventory to track stock levels.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const stockLevel = getStockLevel(item.quantity);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.products?.name || "N/A"}</TableCell>
                  <TableCell>{item.products?.sku || "N/A"}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={stockLevel.variant}>{stockLevel.label}</Badge>
                  </TableCell>
                  <TableCell>{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Inventory;
