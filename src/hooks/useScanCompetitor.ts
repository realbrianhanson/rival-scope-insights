import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type ScanPhase = "idle" | "scanning" | "analyzing";

export function useScanCompetitor() {
  const [scanningMap, setScanningMap] = useState<Record<string, ScanPhase>>({});
  const queryClient = useQueryClient();
  const pollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const getPhase = (competitorId: string): ScanPhase =>
    scanningMap[competitorId] || "idle";

  const setPhase = (competitorId: string, phase: ScanPhase) =>
    setScanningMap((prev) => ({ ...prev, [competitorId]: phase }));

  const stopPolling = (competitorId: string) => {
    if (pollRefs.current[competitorId]) {
      clearInterval(pollRefs.current[competitorId]);
      delete pollRefs.current[competitorId];
    }
  };

  const startScan = useCallback(
    async (competitorId: string, competitorName: string, jobType: string, userId: string) => {
      setPhase(competitorId, "scanning");
      toast.info(`Scanning ${competitorName}...`);

      try {
        const { data, error } = await supabase.functions.invoke("scrape-competitor", {
          body: { competitor_id: competitorId, job_type: jobType, user_id: userId },
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Scan failed");

        const jobId = data.job_id;

        // Poll scrape_jobs
        pollRefs.current[competitorId] = setInterval(async () => {
          const { data: job } = await supabase
            .from("scrape_jobs")
            .select("status, pages_scraped, error_message")
            .eq("id", jobId)
            .single();

          if (!job) return;

          if (job.status === "completed") {
            stopPolling(competitorId);
            toast.success(`${job.pages_scraped} pages scanned`);

            // Auto-trigger analysis
            setPhase(competitorId, "analyzing");
            toast.info(`Analyzing ${competitorName}...`);

            try {
              const { data: analysisData, error: analysisError } =
                await supabase.functions.invoke("analyze-competitor", {
                  body: {
                    competitor_id: competitorId,
                    user_id: userId,
                    analysis_type: "full_intel",
                  },
                });

              if (analysisError) throw new Error(analysisError.message);
              if (!analysisData?.success && !analysisData?.partial) {
                throw new Error(analysisData?.error || "Analysis failed");
              }

              toast.success("Analysis complete");
            } catch (e: any) {
              toast.error(`Analysis failed: ${e.message}`);
            }

            setPhase(competitorId, "idle");
            queryClient.invalidateQueries({ queryKey: ["competitors"] });
            queryClient.invalidateQueries({ queryKey: ["last-analyzed"] });
            queryClient.invalidateQueries({ queryKey: ["competitor-detail"] });
          } else if (job.status === "failed") {
            stopPolling(competitorId);
            toast.error(job.error_message || "Scan failed");
            setPhase(competitorId, "idle");
          }
        }, 3000);
      } catch (e: any) {
        toast.error(`Scan failed: ${e.message}`);
        setPhase(competitorId, "idle");
      }
    },
    [queryClient]
  );

  return { startScan, getPhase };
}
