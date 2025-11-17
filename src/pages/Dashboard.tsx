import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Warehouse, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Stats {
  totalProducts: number;
  lowStockCount: number;
  totalRevenue: number;
  upcomingShows: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    lowStockCount: 0,
    totalRevenue: 0,
    upcomingShows: 0,
  });
  const [upcomingShows, setUpcomingShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Fetch low stock items
      const { data: inventory } = await supabase
        .from("inventory")
        .select("quantity");

      const lowStockCount = inventory?.filter(item => item.quantity < 10).length || 0;

      // Fetch total revenue
      const { data: sales } = await supabase
        .from("sales_orders")
        .select("payout");

      const totalRevenue = sales?.reduce((sum, order) => sum + (order.payout || 0), 0) || 0;

      // Fetch upcoming shows
      const today = new Date().toISOString().split('T')[0];
      const { data: showsData, count: showsCount } = await supabase
        .from("shows")
        .select("*, tours(name)", { count: "exact" })
        .gte("show_date", today)
        .order("show_date", { ascending: true })
        .limit(5);

      setStats({
        totalProducts: productsCount || 0,
        lowStockCount,
        totalRevenue,
        upcomingShows: showsCount || 0,
      });

      setUpcomingShows(showsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Active products in catalog",
      onClick: () => navigate("/products"),
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount,
      icon: AlertCircle,
      description: "Items with less than 10 units",
      onClick: () => navigate("/inventory"),
      variant: stats.lowStockCount > 0 ? "warning" : "default",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "All-time sales payout",
      onClick: () => navigate("/sales"),
    },
    {
      title: "Upcoming Shows",
      value: stats.upcomingShows,
      icon: Calendar,
      description: "Scheduled performances",
      onClick: () => navigate("/shows"),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={card.onClick}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {upcomingShows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Shows</CardTitle>
                <CardDescription>Next 5 scheduled performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingShows.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{show.venue}</p>
                        <p className="text-sm text-muted-foreground">
                          {show.city}, {show.state} • {show.tours?.name || "No tour"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(show.show_date).toLocaleDateString()}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {show.advancing_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate("/shows")}
                  >
                    View All Shows
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
