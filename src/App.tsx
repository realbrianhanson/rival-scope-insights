import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import StubPage from "./pages/StubPage";
import Competitors from "./pages/Competitors";
import CompetitorDetail from "./pages/CompetitorDetail";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Battlecards from "./pages/Battlecards";
import BattlecardDetail from "./pages/BattlecardDetail";
import MarketGapsPage from "./pages/MarketGaps";
import ComparisonsPage from "./pages/Comparisons";
import ComparisonDetail from "./pages/ComparisonDetail";
import AlertsPage from "./pages/Alerts";
import SettingsPage from "./pages/Settings";
import SharedView from "./pages/SharedView";
import OnboardingWizard from "./components/OnboardingWizard";
import { Settings } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) { setNeedsOnboarding(false); return; }
    const check = async () => {
      const [profileRes, compRes] = await Promise.all([
        supabase.from("profiles").select("company_name").eq("id", user.id).single(),
        supabase.from("competitors").select("id", { count: "exact", head: true }),
      ]);
      const hasCompany = !!profileRes.data?.company_name;
      const hasComps = (compRes.count ?? 0) > 0;
      setNeedsOnboarding(!hasCompany && !hasComps);
    };
    check();
  }, [user]);

  if (needsOnboarding === null) return <div className="min-h-screen bg-background" />;
  if (needsOnboarding && !dismissed) {
    return <OnboardingWizard onComplete={() => setDismissed(true)} />;
  }
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
              <Route path="/" element={<ProtectedRoute><OnboardingGate><Index /></OnboardingGate></ProtectedRoute>} />
              <Route path="/competitors" element={<ProtectedRoute><Competitors /></ProtectedRoute>} />
              <Route path="/competitors/:id" element={<ProtectedRoute><CompetitorDetail /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/reports/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
              <Route path="/battlecards" element={<ProtectedRoute><Battlecards /></ProtectedRoute>} />
              <Route path="/battlecards/:id" element={<ProtectedRoute><BattlecardDetail /></ProtectedRoute>} />
              <Route path="/market-gaps" element={<ProtectedRoute><MarketGapsPage /></ProtectedRoute>} />
              <Route path="/comparisons" element={<ProtectedRoute><ComparisonsPage /></ProtectedRoute>} />
              <Route path="/comparisons/:id" element={<ProtectedRoute><ComparisonDetail /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/shared/:token" element={<SharedView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
