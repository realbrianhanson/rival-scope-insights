import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function generateToken(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

export function useSharedLink(contentType: string, contentId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shared-link", contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_links" as any)
        .select("*")
        .eq("content_type", contentType)
        .eq("content_id", contentId!)
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!contentId && !!user,
  });
}

export function useCreateSharedLink() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      expiresAt,
    }: {
      contentType: string;
      contentId: string;
      expiresAt?: string | null;
    }) => {
      const token = generateToken();
      const { data, error } = await supabase
        .from("shared_links" as any)
        .insert({
          user_id: user!.id,
          content_type: contentType,
          content_id: contentId,
          share_token: token,
          expires_at: expiresAt || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["shared-link", vars.contentType, vars.contentId] });
      queryClient.invalidateQueries({ queryKey: ["all-shared-links"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisableSharedLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shared_links" as any)
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-link"] });
      queryClient.invalidateQueries({ queryKey: ["all-shared-links"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAllSharedLinks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all-shared-links", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_links" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });
}

export function useDisableAllSharedLinks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shared_links" as any)
        .update({ is_active: false })
        .eq("user_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-link"] });
      queryClient.invalidateQueries({ queryKey: ["all-shared-links"] });
      toast.success("All shared links disabled");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
