import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Merch Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Track inventory and sales from Ambient Inks and AtVenu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advancing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Manage tours, shows, and AI-generated advancing drafts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
