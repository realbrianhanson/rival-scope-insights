import {
  Play,
  FileText,
  Shield,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Competitor } from "@/hooks/useCompetitors";
import { useUpdateCompetitorStatus } from "@/hooks/useCompetitors";

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

interface CompetitorCardProps {
  competitor: Competitor;
  lastAnalyzed?: string;
}

export function CompetitorCard({ competitor, lastAnalyzed }: CompetitorCardProps) {
  const updateStatus = useUpdateCompetitorStatus();

  const badgeClass = statusStyles[competitor.status] || statusStyles.active;
  const reviewSources = competitor.review_sources
    ? Object.keys(competitor.review_sources)
    : [];

  const handleArchiveToggle = () => {
    updateStatus.mutate({
      id: competitor.id,
      status: competitor.status === "archived" ? "active" : "archived",
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-150 hover:border-border-active hover:shadow-card-hover flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
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

      {/* Meta */}
      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {lastAnalyzed
            ? `Analyzed ${formatDistanceToNow(new Date(lastAnalyzed), { addSuffix: true })}`
            : "Never analyzed"}
        </span>

        {/* Review source badges */}
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
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/[0.06] transition-colors">
              <Play className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Scan competitor</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <FileText className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>View report</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
