import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ReactNode } from "react";
import { FileText, Shield, TrendingUp, GitCompareArrows, Bell, Settings } from "lucide-react";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import StubPage from "./pages/StubPage";
import Competitors from "./pages/Competitors";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/competitors" element={<ProtectedRoute><Competitors /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><StubPage title="Reports" description="Generate competitive intelligence reports." icon={FileText} /></ProtectedRoute>} />
              <Route path="/battlecards" element={<ProtectedRoute><StubPage title="Battlecards" description="Sales-ready competitive battlecards." icon={Shield} /></ProtectedRoute>} />
              <Route path="/market-gaps" element={<ProtectedRoute><StubPage title="Market Gaps" description="Discover opportunities your competitors are missing." icon={TrendingUp} /></ProtectedRoute>} />
              <Route path="/comparisons" element={<ProtectedRoute><StubPage title="Comparisons" description="Side-by-side competitor comparisons." icon={GitCompareArrows} /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><StubPage title="Alerts" description="Real-time competitive movement alerts." icon={Bell} /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><StubPage title="Settings" description="Manage your account and app configuration." icon={Settings} /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
