import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import RCCP from "@/pages/RCCP";
import Scheduler from "@/pages/Scheduler";
import Planbord from "@/pages/Planbord";
import Placeholder from "@/pages/Placeholder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/fomeco-mockup">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rccp" element={<RCCP />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/planbord" element={<Planbord />} />
            <Route path="/orders" element={<Placeholder />} />
            <Route path="/machines" element={<Placeholder />} />
            <Route path="/reports" element={<Placeholder />} />
            <Route path="/settings" element={<Placeholder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
