import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Rocket, PartyPopper, Loader2 } from "lucide-react";

const INDUSTRIES = [
  "SaaS", "E-commerce", "Fintech", "Healthcare", "EdTech",
  "Marketing", "Cybersecurity", "AI/ML", "Developer Tools",
  "Media", "Real Estate", "Logistics", "Other",
];

const TOTAL_STEPS = 4;

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { data: appSettings } = useAppSettings();
  const appName = appSettings?.app_name || "RivalScope";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 2
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 3
  const [competitorName, setCompetitorName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [createdCompetitorId, setCreatedCompetitorId] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!user || !companyName.trim() || !industry) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ company_name: companyName.trim(), industry })
        .eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setStep(3);
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleCreateCompetitor = async () => {
    if (!user || !competitorName.trim() || !websiteUrl.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("competitors")
        .insert({
          user_id: user.id,
          name: competitorName.trim(),
          website_url: websiteUrl.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      setCreatedCompetitorId(data.id);
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-competitors"] });
      setStep(4);
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleStartScanning = async () => {
    if (!user || !createdCompetitorId) return;
    setLaunching(true);
    try {
      await supabase.functions.invoke("scrape-competitor", {
        body: { competitor_id: createdCompetitorId, user_id: user.id, job_type: "full_site" },
      });
      supabase.functions.invoke("analyze-competitor", {
        body: { competitor_id: createdCompetitorId, user_id: user.id, analysis_type: "full_intel" },
      });
      toast.success("Scanning started! Your first report will be ready shortly.");
    } catch {
      toast.error("Scanning failed to start, but you can try again from the dashboard.");
    }
    onComplete();
    navigate("/");
  };

  const handleSkip = () => {
    onComplete();
    navigate("/");
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden">
      {/* Gradient mesh */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[600px] mx-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-card"
          >
            {/* Step 1 — Welcome */}
            {step === 1 && (
              <div className="text-center space-y-6">
                <h1 className="font-display text-4xl text-foreground tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                  {appName}
                </h1>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Welcome to {appName}</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Let's set up your competitive intelligence command center in 60 seconds.
                  </p>
                </div>
                <Button size="lg" className="w-full h-12 font-semibold" onClick={() => setStep(2)}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2 — Company */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Tell us about your business</h2>
                  <p className="text-sm text-muted-foreground mt-1">This helps us tailor your competitive insights.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Company Name *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Inc."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Industry *</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveProfile}
                    disabled={!companyName.trim() || !industry || saving}
                  >
                    {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — First Competitor */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Add your first competitor</h2>
                  <p className="text-sm text-muted-foreground mt-1">We'll analyze them and build your first intelligence report.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Competitor Name *</Label>
                    <Input
                      value={competitorName}
                      onChange={(e) => setCompetitorName(e.target.value)}
                      placeholder="Competitor Co."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Website URL *</Label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://competitor.com"
                      className="mt-1.5"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">You can add more competitors later from the dashboard.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateCompetitor}
                    disabled={!competitorName.trim() || !websiteUrl.trim() || saving}
                  >
                    {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 — Launch */}
            {step === 4 && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
                  <PartyPopper className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">You're all set!</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    We'll scan <span className="text-foreground font-medium">{competitorName}</span> and have your first intelligence report ready in about 60 seconds.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full h-12 font-semibold"
                    onClick={handleStartScanning}
                    disabled={launching}
                  >
                    {launching ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="mr-1.5 h-4 w-4" />
                    )}
                    Start Scanning
                  </Button>
                  <button
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i + 1 === step ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
