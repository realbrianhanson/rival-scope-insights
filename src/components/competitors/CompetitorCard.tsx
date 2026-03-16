import { useNavigate } from "react-router-dom";
import {
  Play,
  FileText,
  Shield,
  Archive,
  ArchiveRestore,
  Loader2,
  Brain,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Competitor } from "@/hooks/useCompetitors";
import { useUpdateCompetitorStatus } from "@/hooks/useCompetitors";
import { ThreatScoreBadge } from "@/components/dashboard/ThreatRadar";


type ScanPhase = "idle" | "scanning" | "analyzing";

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-warning-medium/10 text-warning-medium",
  archived: "bg-muted text-muted-foreground",
};

const reviewSourceLabels: Record<string, string> = {
  g2: "G2",
  capterra: "Capterra",
  trustpilot: "Trustpilot",
};

const scrapeOptions = [
  { label: "Full Site Scan", value: "full_site" },
  { label: "Landing Page Only", value: "landing_page" },
  { label: "Blog & Content", value: "blog" },
  { label: "Pricing Pages", value: "pricing" },
];

interface CompetitorCardProps {
  competitor: Competitor;
  lastAnalyzed?: string;
  scanPhase?: ScanPhase;
  onScan?: (jobType: string) => void;
}

export function CompetitorCard({ competitor, lastAnalyzed, scanPhase = "idle", onScan }: CompetitorCardProps) {
  const updateStatus = useUpdateCompetitorStatus();
  const navigate = useNavigate();

  const badgeClass = statusStyles[competitor.status] || statusStyles.active;
  const reviewSources = competitor.review_sources
    ? Object.keys(competitor.review_sources)
    : [];

  const handleArchiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate({
      id: competitor.id,
      status: competitor.status === "archived" ? "active" : "archived",
    });
  };

  const handleCardClick = () => {
    navigate(`/competitors/${competitor.id}`);
  };

  const isWorking = scanPhase !== "idle";

  return (
    <div
      onClick={handleCardClick}
      className="bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover flex flex-col cursor-pointer relative"
    >
      {/* Threat score badge — top right */}
      <div className="absolute top-4 right-4">
        <ThreatScoreBadge score={(competitor as any).threat_score ?? null} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 pr-12">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground truncate">{competitor.name}</h3>
          <p className="font-mono text-xs text-muted-foreground truncate mt-0.5">
            {competitor.website_url.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <span
          className={cn(
            "text-[11px] uppercase tracking-[0.05em] font-medium px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0",
            badgeClass
          )}
        >
          {competitor.status}
        </span>
      </div>

      {/* Description */}
      {competitor.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{competitor.description}</p>
      )}

      {/* Scanning indicator — upgraded */}
      {isWorking && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-lg bg-primary/[0.04] border border-primary/10">
          <div className="relative w-4 h-4 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary absolute top-1 left-1" />
            <svg className="absolute inset-0 w-4 h-4 animate-spin" style={{ animationDuration: "1.5s" }} viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="12 32" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-foreground block">
              {scanPhase === "scanning" ? "Scanning pages..." : "Running AI analysis..."}
            </span>
            <span className="text-[10px] text-muted-foreground">This may take a moment</span>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {lastAnalyzed
            ? `Analyzed ${formatDistanceToNow(new Date(lastAnalyzed), { addSuffix: true })}`
            : "Never analyzed"}
        </span>
        {reviewSources.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {reviewSources.map((src) => (
              <span
                key={src}
                className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {reviewSourceLabels[src] || src}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isWorking}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/[0.06] transition-colors disabled:opacity-50"
                >
                  {isWorking ? (
                    scanPhase === "scanning" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Brain className="h-4 w-4 text-accent animate-pulse" />
                    )
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Scan competitor</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-48">
            {scrapeOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onSelect={() => onScan?.(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
            {reviewSources.length > 0 && (
              <DropdownMenuItem onSelect={() => onScan?.("reviews")}>
                Reviews
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(`/competitors/${competitor.id}`)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>View report</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(`/competitors/${competitor.id}?tab=overview`)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Shield className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Battlecard</TooltipContent>
        </Tooltip>

        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleArchiveToggle}
                disabled={updateStatus.isPending}
                className="p-2 rounded-lg text-muted-foreground hover:text-warning hover:bg-warning/[0.06] transition-colors"
              >
                {competitor.status === "archived" ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {competitor.status === "archived" ? "Restore" : "Archive"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
