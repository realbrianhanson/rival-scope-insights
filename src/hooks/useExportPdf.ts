import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useExportPdf() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const exportPdf = async (contentType: "report" | "battlecard", contentId: string) => {
    if (!user || exporting) return;
    setExporting(true);
    const toastId = toast.loading("Generating export...");

    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { user_id: user.id, content_type: contentType, content_id: contentId },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Export failed");

      toast.success("Export ready! Downloading...", { id: toastId });

      // Auto-download
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName || "export.html";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      toast.error(e.message || "Export failed. Use browser print as fallback.", { id: toastId });
      // Fallback to window.print
      window.print();
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportPdf };
}
