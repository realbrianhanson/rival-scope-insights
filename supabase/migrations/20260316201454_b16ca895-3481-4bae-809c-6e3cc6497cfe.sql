CREATE TABLE public.shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage their links
CREATE POLICY "Users can view own shared_links" ON public.shared_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shared_links" ON public.shared_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shared_links" ON public.shared_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shared_links" ON public.shared_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Public can read by share_token (for the public view page)
CREATE POLICY "Public can read active shared links by token" ON public.shared_links FOR SELECT TO anon USING (is_active = true AND share_token IS NOT NULL);
-- Public can increment view_count
CREATE POLICY "Public can update view count" ON public.shared_links FOR UPDATE TO anon USING (is_active = true) WITH CHECK (is_active = true);