import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  label: string;
}

interface AnalysisProgressProps {
  steps: ProgressStep[];
  /** Whether the operation is currently running */
  active: boolean;
  /** Current step index (0-based). If not provided, auto-advances based on time. */
  currentStep?: number;
  /** Whether the operation completed (jumps to all-done) */
  completed?: boolean;
  /** Estimated total duration in ms for auto-advance mode */
  estimatedDuration?: number;
  /** Title shown above the stepper */
  title?: string;
}

export const STEP_CONFIGS = {
  scraping: [
    { label: "Connecting to site" },
    { label: "Crawling pages" },
    { label: "Classifying content" },
    { label: "Storing results" },
  ],
  full_analysis: [
    { label: "Gathering scraped data" },
    { label: "Running AI analysis" },
    { label: "Extracting insights" },
    { label: "Building report" },
    { label: "Scoring threats" },
  ],
  battlecard: [
    { label: "Pulling intelligence" },
    { label: "Crafting positioning" },
    { label: "Building battlecard" },
  ],
  comparison: [
    { label: "Gathering competitor data" },
    { label: "Analyzing differences" },
    { label: "Building matrix" },
  ],
  briefing: [
    { label: "Surveying landscape" },
    { label: "Analyzing threats" },
    { label: "Identifying opportunities" },
    { label: "Writing briefing" },
  ],
};

export function AnalysisProgress({
  steps,
  active,
  currentStep: controlledStep,
  completed = false,
  estimatedDuration = 20000,
  title,
}: AnalysisProgressProps) {
  const [autoStep, setAutoStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const stepCount = steps.length;
  const stepDuration = estimatedDuration / stepCount;

  useEffect(() => {
    if (!active || controlledStep !== undefined) return;
    setAutoStep(0);
    timerRef.current = setInterval(() => {
      setAutoStep((prev) => {
        if (prev >= stepCount - 1) {
          clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);
    return () => clearInterval(timerRef.current);
  }, [active, controlledStep, stepCount, stepDuration]);

  useEffect(() => {
    if (completed) {
      clearInterval(timerRef.current);
    }
  }, [completed]);

  const current = completed ? stepCount : (controlledStep ?? autoStep);

  return (
    <div className="py-6">
      {title && (
        <h3 className="text-base font-semibold text-foreground text-center mb-8">{title}</h3>
      )}
      <div className="space-y-0 pl-4">
        {steps.map((step, i) => {
          const status = completed || i < current ? "done" : i === current ? "active" : "pending";
          const isLast = i === stepCount - 1;

          return (
            <div key={i} className="flex items-start gap-4 relative">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[7px] top-[18px] w-[2px] h-[calc(100%)] z-0">
                  <div className="w-full h-full bg-muted" />
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-full transition-all duration-500 ease-out",
                      status === "done" || status === "active" ? "bg-primary" : "bg-transparent"
                    )}
                    style={{ height: status === "done" ? "100%" : status === "active" ? "50%" : "0%" }}
                  />
                </div>
              )}

              {/* Circle indicator */}
              <div className="relative z-10 flex-shrink-0">
                {status === "done" ? (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                ) : status === "active" ? (
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center relative">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {/* Spinning ring */}
                    <svg className="absolute inset-0 w-4 h-4 animate-spin" style={{ animationDuration: "1.5s" }} viewBox="0 0 16 16">
                      <circle
                        cx="8" cy="8" r="7"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="1.5"
                        strokeDasharray="12 32"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-muted" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium pb-6 transition-colors duration-300",
                  status === "done"
                    ? "text-muted-foreground"
                    : status === "active"
                    ? "text-foreground"
                    : "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
