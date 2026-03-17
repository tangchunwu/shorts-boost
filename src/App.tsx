import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GuestProvider, useGuest } from "@/contexts/GuestContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import Records from "./pages/Records";
import ContentCalendar from "./pages/ContentCalendar";
import TrendingTopics from "./pages/TrendingTopics";
import CompetitorMonitor from "./pages/CompetitorMonitor";
import Projects from "./pages/Projects";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isGuest } = useGuest();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user && !isGuest) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isGuest } = useGuest();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (user || isGuest) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/analyze" element={<Analyze />} />
      <Route path="/records" element={<Records />} />
      <Route path="/calendar" element={<ContentCalendar />} />
      <Route path="/trending" element={<TrendingTopics />} />
      <Route path="/competitors" element={<CompetitorMonitor />} />
      <Route path="/projects" element={<Projects />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GuestProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </GuestProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
