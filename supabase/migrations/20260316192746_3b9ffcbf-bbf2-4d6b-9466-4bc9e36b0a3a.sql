
-- scrape_jobs
CREATE TABLE public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  pages_scraped INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scrape_jobs" ON public.scrape_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scrape_jobs" ON public.scrape_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scrape_jobs" ON public.scrape_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scrape_jobs" ON public.scrape_jobs FOR DELETE USING (auth.uid() = user_id);

-- scrape_results
CREATE TABLE public.scrape_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_job_id UUID NOT NULL REFERENCES public.scrape_jobs(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_type TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  extracted_data JSONB,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scrape_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scrape_results" ON public.scrape_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scrape_results" ON public.scrape_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scrape_results" ON public.scrape_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scrape_results" ON public.scrape_results FOR DELETE USING (auth.uid() = user_id);

-- analysis_reports
CREATE TABLE public.analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_report JSONB NOT NULL,
  ai_model_used TEXT NOT NULL,
  source_scrape_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analysis_reports" ON public.analysis_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analysis_reports" ON public.analysis_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analysis_reports" ON public.analysis_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analysis_reports" ON public.analysis_reports FOR DELETE USING (auth.uid() = user_id);

-- market_gaps
CREATE TABLE public.market_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.analysis_reports(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  gap_category TEXT NOT NULL,
  gap_title TEXT NOT NULL,
  gap_description TEXT NOT NULL,
  opportunity_score INTEGER NOT NULL,
  evidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.market_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own market_gaps" ON public.market_gaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own market_gaps" ON public.market_gaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own market_gaps" ON public.market_gaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own market_gaps" ON public.market_gaps FOR DELETE USING (auth.uid() = user_id);

-- competitor_snapshots
CREATE TABLE public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  messaging_summary TEXT,
  tech_stack JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own competitor_snapshots" ON public.competitor_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own competitor_snapshots" ON public.competitor_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own competitor_snapshots" ON public.competitor_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own competitor_snapshots" ON public.competitor_snapshots FOR DELETE USING (auth.uid() = user_id);

-- alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- battlecards
CREATE TABLE public.battlecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  their_strengths JSONB NOT NULL,
  their_weaknesses JSONB NOT NULL,
  counter_positioning JSONB NOT NULL,
  pricing_comparison JSONB,
  talk_tracks JSONB NOT NULL,
  key_differentiators JSONB NOT NULL,
  last_updated_from_report_id UUID REFERENCES public.analysis_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.battlecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own battlecards" ON public.battlecards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own battlecards" ON public.battlecards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own battlecards" ON public.battlecards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own battlecards" ON public.battlecards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_battlecards_updated_at
  BEFORE UPDATE ON public.battlecards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- comparison_matrices
CREATE TABLE public.comparison_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  competitor_ids UUID[] NOT NULL,
  categories JSONB NOT NULL,
  matrix_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comparison_matrices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own comparison_matrices" ON public.comparison_matrices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comparison_matrices" ON public.comparison_matrices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comparison_matrices" ON public.comparison_matrices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comparison_matrices" ON public.comparison_matrices FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_comparison_matrices_updated_at
  BEFORE UPDATE ON public.comparison_matrices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- review_analyses
CREATE TABLE public.review_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  positive_themes JSONB NOT NULL,
  negative_themes JSONB NOT NULL,
  requested_features JSONB NOT NULL,
  overall_sentiment_score NUMERIC NOT NULL,
  review_count INTEGER,
  raw_review_data TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own review_analyses" ON public.review_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own review_analyses" ON public.review_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review_analyses" ON public.review_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own review_analyses" ON public.review_analyses FOR DELETE USING (auth.uid() = user_id);
