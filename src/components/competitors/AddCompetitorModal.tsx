import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAddCompetitor } from "@/hooks/useCompetitors";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  website_url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(500)
    .refine(
      (v) => {
        try {
          new URL(v.startsWith("http") ? v : `https://${v}`);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Enter a valid URL" }
    ),
  description: z.string().max(1000).optional(),
  industry: z.string().max(100).optional(),
  g2_url: z.string().max(500).optional(),
  capterra_url: z.string().max(500).optional(),
  trustpilot_url: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface AddCompetitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultIndustry?: string;
}

export function AddCompetitorModal({ open, onOpenChange, defaultIndustry }: AddCompetitorModalProps) {
  const addCompetitor = useAddCompetitor();
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      industry: defaultIndustry || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    let url = data.website_url.trim();
    if (!url.startsWith("http")) url = `https://${url}`;

    const reviewSources: Record<string, string> = {};
    if (data.g2_url?.trim()) reviewSources.g2 = data.g2_url.trim();
    if (data.capterra_url?.trim()) reviewSources.capterra = data.capterra_url.trim();
    if (data.trustpilot_url?.trim()) reviewSources.trustpilot = data.trustpilot_url.trim();

    await addCompetitor.mutateAsync({
      name: data.name.trim(),
      website_url: url,
      description: data.description?.trim(),
      industry: data.industry?.trim(),
      review_sources: reviewSources,
    });

    reset();
    setReviewsOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-raised border-border sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">Add Competitor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
              Competitor Name *
            </Label>
            <Input {...register("name")} placeholder="Acme Corp" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
              Website URL *
            </Label>
            <Input {...register("website_url")} placeholder="https://acme.com" />
            {errors.website_url && (
              <p className="text-xs text-destructive">{errors.website_url.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
              Description
            </Label>
            <Textarea
              {...register("description")}
              placeholder="Brief description of this competitor..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
              Industry
            </Label>
            <Input {...register("industry")} placeholder="SaaS, Fintech, etc." />
          </div>

          {/* Review Sources */}
          <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  reviewsOpen && "rotate-180"
                )}
              />
              Review Sources (optional)
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">G2 Page URL</Label>
                <Input {...register("g2_url")} placeholder="https://g2.com/products/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Capterra Page URL</Label>
                <Input {...register("capterra_url")} placeholder="https://capterra.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Trustpilot Page URL</Label>
                <Input {...register("trustpilot_url")} placeholder="https://trustpilot.com/..." />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addCompetitor.isPending}>
              {addCompetitor.isPending ? "Adding..." : "Add Competitor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
