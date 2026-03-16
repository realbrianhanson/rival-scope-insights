import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Link2, Eye, Loader2, Trash2 } from "lucide-react";
import {
  useSharedLink,
  useCreateSharedLink,
  useDisableSharedLink,
} from "@/hooks/useSharedLinks";

interface ShareLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "report" | "battlecard" | "comparison";
  contentId: string;
}

function getExpiresAt(value: string): string | null {
  if (value === "never") return null;
  const hours = parseInt(value);
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function ShareLinkModal({ open, onOpenChange, contentType, contentId }: ShareLinkModalProps) {
  const { data: existingLink, isLoading } = useSharedLink(contentType, contentId);
  const createLink = useCreateSharedLink();
  const disableLink = useDisableSharedLink();
  const [expiration, setExpiration] = useState("never");

  const shareUrl = existingLink?.share_token
    ? `${window.location.origin}/shared/${existingLink.share_token}`
    : "";

  const handleEnable = async () => {
    await createLink.mutateAsync({
      contentType,
      contentId,
      expiresAt: getExpiresAt(expiration),
    });
    toast.success("Public link created!");
  };

  const handleDisable = () => {
    if (existingLink?.id) {
      disableLink.mutate(existingLink.id);
      toast.success("Link disabled");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="h-4 w-4 text-primary" />
            Share {contentType === "report" ? "Report" : contentType === "battlecard" ? "Battlecard" : "Comparison"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : existingLink ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Public link enabled</Label>
              <Switch checked onCheckedChange={() => handleDisable()} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Share URL</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span>{existingLink.view_count} view{existingLink.view_count !== 1 ? "s" : ""}</span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleDisable}
              disabled={disableLink.isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Disable Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Enable public link</Label>
              <Switch checked={false} onCheckedChange={() => handleEnable()} disabled={createLink.isPending} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Expiration</Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Anyone with the link can view this {contentType} without logging in.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
