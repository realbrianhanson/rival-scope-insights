CREATE TABLE public.competitor_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_name text NOT NULL,
  suggested_url text NOT NULL,
  reason text NOT NULL,
  relevance text NOT NULL DEFAULT 'direct_competitor',
  source_competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  source_report_id uuid NOT NULL REFERENCES public.analysis_reports(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions" ON public.competitor_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suggestions" ON public.competitor_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestions" ON public.competitor_suggestions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggestions" ON public.competitor_suggestions FOR DELETE USING (auth.uid() = user_id);