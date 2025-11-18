import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import MasterInventory from "./pages/MasterInventory";
import ImportData from "./pages/ImportData";
import Sales from "./pages/Sales";
import Tours from "./pages/Tours";
import Shows from "./pages/Shows";
import EventDetail from "./pages/EventDetail";
import Drafts from "./pages/Drafts";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
          <Route path="/master-inventory" element={<Layout><MasterInventory /></Layout>} />
          <Route path="/import" element={<Layout><ImportData /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/tours" element={<Layout><Tours /></Layout>} />
          <Route path="/shows" element={<Layout><Shows /></Layout>} />
          <Route path="/shows/:eventId" element={<Layout><EventDetail /></Layout>} />
          <Route path="/drafts" element={<Layout><Drafts /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
